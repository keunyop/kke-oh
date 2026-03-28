import vm from 'node:vm';

const MAX_GENERATED_SCRIPT_COUNT = 24;
const MAX_FLUSHED_TIMERS = 20;
const MAX_FLUSHED_ANIMATION_FRAMES = 8;
const DEFAULT_CANVAS_WIDTH = 960;
const DEFAULT_CANVAS_HEIGHT = 540;
const DEFAULT_VIEWPORT_WIDTH = 1280;
const DEFAULT_VIEWPORT_HEIGHT = 720;
const SCORE_UI_HINT_REGEX = /score|scores|points?|hud|stats?|점수|스코어|최종점수/i;
const NON_GAMEPLAY_UI_HINT_REGEX = /\b(game-?over|start|title|menu|modal|dialog|tutorial|result|overlay|screen)\b|시작|튜토리얼|게임오버/i;
const POSITIONED_OVERLAY_REGEX = /(?:^|[;{\s])position\s*:\s*(absolute|fixed)\b/i;
const DISPLAY_NONE_REGEX = /(?:^|[;{\s])display\s*:\s*none\b/i;

type EventListener = (event?: Record<string, unknown>) => void;

type TimerEntry = {
  id: number;
  callback: () => void;
  repeat: boolean;
  cleared: boolean;
};

type HarnessState = {
  animationFrameRequests: number;
  canvasContextRequests: number;
  submittedScores: number[];
  keyboardListenerCount: number;
  pointerListenerCount: number;
  timerRegistrationCount: number;
  timerExecutionCount: number;
  clickedStartButtons: number;
};

export type AiGamePlayabilityResult = {
  scriptCount: number;
  animationFrameRequests: number;
  canvasContextRequests: number;
  submittedScores: number[];
};

type PlayabilitySnapshot = {
  animationFrameRequests: number;
  canvasContextRequests: number;
  keyboardListenerCount: number;
  pointerListenerCount: number;
  timerRegistrationCount: number;
  timerExecutionCount: number;
  submittedScoreCount: number;
};

export class AiGamePlayabilityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AiGamePlayabilityError';
  }
}

class EventTargetStub {
  private listeners = new Map<string, Set<EventListener>>();

  addEventListener(type: string, listener: EventListener) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }

    this.listeners.get(type)?.add(listener);
  }

  removeEventListener(type: string, listener: EventListener) {
    this.listeners.get(type)?.delete(listener);
  }

  dispatchEvent(event?: Record<string, unknown>) {
    const type = typeof event?.type === 'string' ? event.type : '';
    if (!type) {
      return true;
    }

    for (const listener of this.listeners.get(type) ?? []) {
      listener.call(this, event);
    }

    return true;
  }
}

class ClassListStub {
  private values = new Set<string>();

  add(...tokens: string[]) {
    for (const token of tokens) {
      if (token) {
        this.values.add(token);
      }
    }
  }

  remove(...tokens: string[]) {
    for (const token of tokens) {
      this.values.delete(token);
    }
  }

  contains(token: string) {
    return this.values.has(token);
  }

  toggle(token: string, force?: boolean) {
    if (force === true) {
      this.values.add(token);
      return true;
    }

    if (force === false) {
      this.values.delete(token);
      return false;
    }

    if (this.values.has(token)) {
      this.values.delete(token);
      return false;
    }

    this.values.add(token);
    return true;
  }

  toString() {
    return [...this.values].join(' ');
  }
}

class ElementStub extends EventTargetStub {
  readonly tagName: string;
  readonly ownerDocument: DocumentStub;
  readonly children: ElementStub[] = [];
  readonly style: Record<string, string> = {};
  readonly dataset: Record<string, string> = {};
  readonly classList = new ClassListStub();
  parentNode: ElementStub | null = null;
  textContent = '';
  value = '';
  disabled = false;
  width = DEFAULT_CANVAS_WIDTH;
  height = DEFAULT_CANVAS_HEIGHT;
  onclick?: () => void;
  private attributes = new Map<string, string>();
  private html = '';

  constructor(tagName: string, ownerDocument: DocumentStub) {
    super();
    this.tagName = tagName.toUpperCase();
    this.ownerDocument = ownerDocument;
  }

  override addEventListener(type: string, listener: EventListener) {
    trackListenerRegistration(this.ownerDocument.state, type);
    super.addEventListener(type, listener);
  }

  get id() {
    return this.getAttribute('id') ?? '';
  }

  set id(value: string) {
    this.setAttribute('id', value);
  }

  get className() {
    return this.classList.toString();
  }

  set className(value: string) {
    this.classList.remove(...this.className.split(/\s+/).filter(Boolean));
    this.classList.add(...value.split(/\s+/).filter(Boolean));
  }

  get innerHTML() {
    return this.html;
  }

  set innerHTML(value: string) {
    this.html = value;
    this.children.length = 0;
    this.ownerDocument.populateFromHtml(value, this);
  }

  appendChild(child: ElementStub) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  removeChild(child: ElementStub) {
    const index = this.children.indexOf(child);
    if (index >= 0) {
      this.children.splice(index, 1);
      child.parentNode = null;
    }

    return child;
  }

  remove() {
    this.parentNode?.removeChild(this);
  }

  append(...nodes: Array<ElementStub | string>) {
    for (const node of nodes) {
      if (typeof node === 'string') {
        const textNode = this.ownerDocument.createElement('span');
        textNode.textContent = node;
        this.appendChild(textNode);
      } else {
        this.appendChild(node);
      }
    }
  }

  prepend(...nodes: Array<ElementStub | string>) {
    const created = nodes.map((node) => {
      if (typeof node === 'string') {
        const textNode = this.ownerDocument.createElement('span');
        textNode.textContent = node;
        return textNode;
      }

      return node;
    });

    for (const node of created.reverse()) {
      node.parentNode = this;
      this.children.unshift(node);
    }
  }

  insertAdjacentHTML(_position: string, html: string) {
    this.ownerDocument.populateFromHtml(html, this);
  }

  setAttribute(name: string, value: string) {
    this.attributes.set(name, value);

    if (name === 'id') {
      this.ownerDocument.registerElementId(value, this);
    }

    if (name === 'class') {
      this.className = value;
    }
  }

  getAttribute(name: string) {
    return this.attributes.get(name) ?? null;
  }

  focus() {}

  blur() {}

  click() {
    this.onclick?.();
    this.dispatchEvent({ type: 'click', target: this, currentTarget: this, preventDefault() {} });
  }

  getBoundingClientRect() {
    return {
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      bottom: this.height,
      right: this.width,
      width: this.width,
      height: this.height
    };
  }

  querySelector(selector: string) {
    return this.ownerDocument.querySelectorWithin(this, selector);
  }

  querySelectorAll(selector: string) {
    return this.ownerDocument.querySelectorAllWithin(this, selector);
  }

  getContext(contextId: string) {
    void contextId;
    if (this.tagName !== 'CANVAS') {
      return null;
    }

    this.ownerDocument.state.canvasContextRequests += 1;

    return new Proxy(
      {},
      {
        get: (_target, property) => {
          if (property === 'canvas') {
            return this;
          }

          if (property === 'measureText') {
            return (value: string) => ({ width: String(value ?? '').length * 8 });
          }

          if (property === 'createLinearGradient' || property === 'createRadialGradient') {
            return () => ({ addColorStop() {} });
          }

          if (property === 'createPattern') {
            return () => ({});
          }

          if (property === 'getImageData') {
            return () => ({ data: new Uint8ClampedArray(Math.max(4, this.width * this.height * 4)) });
          }

          if (property === 'putImageData') {
            return () => {};
          }

          return () => {};
        },
        set: () => true
      }
    );
  }
}

class DocumentStub extends EventTargetStub {
  readonly state: HarnessState;
  readonly documentElement: ElementStub;
  readonly head: ElementStub;
  readonly body: ElementStub;
  readonly elementsById = new Map<string, ElementStub>();
  readonly allElements: ElementStub[] = [];
  readyState: 'loading' | 'interactive' | 'complete' = 'loading';
  hidden = false;
  title = '';

  constructor(state: HarnessState) {
    super();
    this.state = state;
    this.documentElement = this.createElement('html');
    this.head = this.createElement('head');
    this.body = this.createElement('body');
    this.documentElement.appendChild(this.head);
    this.documentElement.appendChild(this.body);
  }

  createElement(tagName: string) {
    const element = new ElementStub(tagName, this);
    this.allElements.push(element);
    return element;
  }

  createTextNode(value: string) {
    const node = this.createElement('span');
    node.textContent = value;
    return node;
  }

  getElementById(id: string) {
    const existing = this.elementsById.get(id);
    if (existing) {
      return existing;
    }

    const fallbackTag = /canvas/i.test(id) ? 'canvas' : 'div';
    const element = this.createElement(fallbackTag);
    element.id = id;
    this.body.appendChild(element);
    return element;
  }

  registerElementId(id: string, element: ElementStub) {
    if (id) {
      this.elementsById.set(id, element);
    }
  }

  populateFromHtml(html: string, parent = this.body) {
    const tagPattern = /<(canvas|button|div|main|section|article|span|p|h1|h2|h3|input|label)([^>]*)>/gi;

    for (const match of html.matchAll(tagPattern)) {
      const tagName = match[1];
      const attributes = match[2] ?? '';
      const element = this.createElement(tagName);
      const idMatch = attributes.match(/\sid=(["'])(.*?)\1/i);
      const classMatch = attributes.match(/\sclass=(["'])(.*?)\1/i);
      const textMatch =
        tagName === 'button'
          ? new RegExp(`<button[^>]*>${'([\\s\\S]*?)'}</button>`, 'i').exec(html.slice(match.index))
          : null;

      if (idMatch?.[2]) {
        element.id = idMatch[2];
      }

      if (classMatch?.[2]) {
        element.className = classMatch[2];
      }

      if (textMatch?.[1]) {
        element.textContent = stripHtml(textMatch[1]);
      }

      parent.appendChild(element);
    }
  }

  querySelector(selector: string) {
    return this.querySelectorWithin(this.body, selector);
  }

  querySelectorAll(selector: string) {
    return this.querySelectorAllWithin(this.body, selector);
  }

  querySelectorWithin(root: ElementStub, selector: string): ElementStub | null {
    return this.querySelectorAllWithin(root, selector)[0] ?? null;
  }

  querySelectorAllWithin(root: ElementStub, selector: string): ElementStub[] {
    const normalizedSelector = selector.trim();
    if (!normalizedSelector) {
      return [];
    }

    if (normalizedSelector.startsWith('#')) {
      const target = this.elementsById.get(normalizedSelector.slice(1));
      return target ? [target] : [];
    }

    const matcher = normalizedSelector.toUpperCase();
    const matches: ElementStub[] = [];
    const stack = [...root.children];

    while (stack.length) {
      const current = stack.shift();
      if (!current) {
        continue;
      }

      if (current.tagName === matcher) {
        matches.push(current);
      }

      stack.unshift(...current.children);
    }

    if (!matches.length && matcher === 'CANVAS') {
      const fallback = this.createElement('canvas');
      root.appendChild(fallback);
      return [fallback];
    }

    return matches;
  }
}

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function trackListenerRegistration(state: HarnessState, type: string) {
  if (/^key/i.test(type)) {
    state.keyboardListenerCount += 1;
  }

  if (/^(pointer|mouse|touch|click)/i.test(type)) {
    state.pointerListenerCount += 1;
  }
}

function getPlayabilitySnapshot(state: HarnessState): PlayabilitySnapshot {
  return {
    animationFrameRequests: state.animationFrameRequests,
    canvasContextRequests: state.canvasContextRequests,
    keyboardListenerCount: state.keyboardListenerCount,
    pointerListenerCount: state.pointerListenerCount,
    timerRegistrationCount: state.timerRegistrationCount,
    timerExecutionCount: state.timerExecutionCount,
    submittedScoreCount: state.submittedScores.length
  };
}

function hasStrongGameplayEvidence(snapshot: PlayabilitySnapshot) {
  const loopReady = snapshot.animationFrameRequests > 0 || snapshot.timerRegistrationCount > 0 || snapshot.timerExecutionCount > 0;
  const interactionReady = snapshot.keyboardListenerCount > 0 || snapshot.pointerListenerCount > 0;
  const presentationReady = snapshot.canvasContextRequests > 0 || snapshot.submittedScoreCount > 0;

  return loopReady && (interactionReady || presentationReady);
}

function snapshotChanged(before: PlayabilitySnapshot, after: PlayabilitySnapshot) {
  return (
    after.animationFrameRequests > before.animationFrameRequests ||
    after.canvasContextRequests > before.canvasContextRequests ||
    after.keyboardListenerCount > before.keyboardListenerCount ||
    after.pointerListenerCount > before.pointerListenerCount ||
    after.timerRegistrationCount > before.timerRegistrationCount ||
    after.timerExecutionCount > before.timerExecutionCount ||
    after.submittedScoreCount > before.submittedScoreCount
  );
}

function createStorage() {
  const store = new Map<string, string>();

  return {
    getItem(key: string) {
      return store.has(key) ? store.get(key) ?? null : null;
    },
    setItem(key: string, value: unknown) {
      store.set(key, String(value));
    },
    removeItem(key: string) {
      store.delete(key);
    },
    clear() {
      store.clear();
    }
  };
}

function extractInlineScripts(html: string): string[] {
  const scripts: string[] = [];

  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const attributes = match[1] ?? '';
    const body = match[2] ?? '';

    if (/\bsrc\s*=/i.test(attributes)) {
      throw new AiGamePlayabilityError('Generated HTML cannot depend on external script files.');
    }

    if (body.trim()) {
      scripts.push(body);
    }
  }

  return scripts;
}

function hasTopLeftOverlayPosition(styleText: string) {
  if (!POSITIONED_OVERLAY_REGEX.test(styleText) || DISPLAY_NONE_REGEX.test(styleText)) {
    return false;
  }

  const anchors = [...styleText.matchAll(/(?:^|[;{\s])(top|left)\s*:\s*(?:0|[1-2]?\d(?:\.\d+)?(?:px|rem|em|vh|vw|svh|svw|dvh|dvw|%))\b/gi)].map(
    (match) => match[1]?.toLowerCase()
  );

  return anchors.includes('top') && anchors.includes('left');
}

function looksLikeGameplayScoreUi(value: string) {
  return SCORE_UI_HINT_REGEX.test(value) && !NON_GAMEPLAY_UI_HINT_REGEX.test(value);
}

function hasOverlappingTopLeftScoreHud(html: string) {
  for (const styleMatch of html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) {
    const cssText = styleMatch[1] ?? '';

    for (const ruleMatch of cssText.matchAll(/([^{}]+)\{([^{}]+)\}/g)) {
      const selector = ruleMatch[1]?.trim() ?? '';
      const declarations = ruleMatch[2] ?? '';

      if (!selector || !looksLikeGameplayScoreUi(selector)) {
        continue;
      }

      if (hasTopLeftOverlayPosition(declarations)) {
        return true;
      }
    }
  }

  for (const elementMatch of html.matchAll(/<(div|section|aside|header|span|p)\b([^>]*)>/gi)) {
    const attributes = elementMatch[2] ?? '';
    const styleMatch = attributes.match(/\sstyle=(["'])([\s\S]*?)\1/i);
    if (!styleMatch?.[2] || !hasTopLeftOverlayPosition(styleMatch[2])) {
      continue;
    }

    const snippet = html.slice(elementMatch.index ?? 0, (elementMatch.index ?? 0) + 240);
    if (looksLikeGameplayScoreUi(`${attributes} ${snippet}`)) {
      return true;
    }
  }

  return false;
}

function createSmokeHarness(html: string) {
  const state: HarnessState = {
    animationFrameRequests: 0,
    canvasContextRequests: 0,
    submittedScores: [],
    keyboardListenerCount: 0,
    pointerListenerCount: 0,
    timerRegistrationCount: 0,
    timerExecutionCount: 0,
    clickedStartButtons: 0
  };
  const document = new DocumentStub(state);
  document.populateFromHtml(html);

  let nextTimerId = 1;
  let nextAnimationFrameId = 1;
  const timers = new Map<number, TimerEntry>();
  const animationFrames = new Map<number, FrameRequestCallback>();

  const localStorage = createStorage();
  const sessionStorage = createStorage();
  const originalDocumentAddEventListener = document.addEventListener.bind(document);
  const originalDocumentRemoveEventListener = document.removeEventListener.bind(document);

  const sandbox: Record<string, unknown> = {
    console: {
      log() {},
      info() {},
      warn() {},
      error() {}
    },
    Math,
    Date,
    JSON,
    Number,
    String,
    Boolean,
    Array,
    Object,
    RegExp,
    Map,
    Set,
    WeakMap,
    WeakSet,
    Promise,
    URL,
    URLSearchParams,
    navigator: {
      userAgent: 'kke-oh-smoke-harness',
      language: 'en-US',
      maxTouchPoints: 0
    },
    location: {
      href: 'https://kke-oh.vercel.app/game/smoke',
      origin: 'https://kke-oh.vercel.app'
    },
    innerWidth: DEFAULT_VIEWPORT_WIDTH,
    innerHeight: DEFAULT_VIEWPORT_HEIGHT,
    document,
    localStorage,
    sessionStorage,
    performance: {
      now: () => Date.now()
    },
    requestAnimationFrame(callback: FrameRequestCallback) {
      state.animationFrameRequests += 1;
      const id = nextAnimationFrameId++;
      animationFrames.set(id, callback);
      return id;
    },
    cancelAnimationFrame(id: number) {
      animationFrames.delete(id);
    },
    setTimeout(callback: TimerHandler) {
      state.timerRegistrationCount += 1;
      const id = nextTimerId++;
      timers.set(id, {
        id,
        callback: typeof callback === 'function' ? () => callback() : () => {},
        repeat: false,
        cleared: false
      });
      return id;
    },
    clearTimeout(id: number) {
      const timer = timers.get(id);
      if (timer) {
        timer.cleared = true;
      }
    },
    setInterval(callback: TimerHandler) {
      state.timerRegistrationCount += 1;
      const id = nextTimerId++;
      timers.set(id, {
        id,
        callback: typeof callback === 'function' ? () => callback() : () => {},
        repeat: true,
        cleared: false
      });
      return id;
    },
    clearInterval(id: number) {
      const timer = timers.get(id);
      if (timer) {
        timer.cleared = true;
      }
    },
    fetch: async () => ({
      ok: true,
      status: 200,
      json: async () => ({}),
      text: async () => ''
    }),
    Image: class ImageStub {
      src = '';
    },
    Audio: class AudioStub {
      src = '';
      play() {
        return Promise.resolve();
      }
      pause() {}
    },
    matchMedia: () => ({
      matches: false,
      media: '',
      addEventListener() {},
      removeEventListener() {}
    }),
    alert() {},
    confirm() {
      return true;
    },
    prompt() {
      return '';
    },
    kkeohSubmitScore(score: unknown) {
      const numeric = Number(score);
      if (Number.isFinite(numeric)) {
        state.submittedScores.push(Math.round(numeric));
      }

      return true;
    },
    HTMLElement: ElementStub,
    HTMLCanvasElement: ElementStub,
    Event: class EventStub {
      type: string;
      constructor(type: string) {
        this.type = type;
      }
    },
    CustomEvent: class CustomEventStub {
      type: string;
      detail: unknown;
      constructor(type: string, init?: { detail?: unknown }) {
        this.type = type;
        this.detail = init?.detail;
      }
    }
  };

  const windowTarget = new EventTargetStub();
  const originalWindowAddEventListener = windowTarget.addEventListener.bind(windowTarget);
  const originalWindowRemoveEventListener = windowTarget.removeEventListener.bind(windowTarget);
  const originalWindowDispatchEvent = windowTarget.dispatchEvent.bind(windowTarget);
  const windowObject = Object.assign(windowTarget, sandbox, {
    addEventListener(type: string, listener: EventListener) {
      trackListenerRegistration(state, type);
      originalWindowAddEventListener(type, listener);
    },
    removeEventListener(type: string, listener: EventListener) {
      originalWindowRemoveEventListener(type, listener);
    },
    dispatchEvent(event?: Record<string, unknown>) {
      return originalWindowDispatchEvent(event);
    }
  });

  document.addEventListener = function addDocumentListener(type: string, listener: EventListener) {
    trackListenerRegistration(state, type);
    originalDocumentAddEventListener(type, listener);
  };

  document.removeEventListener = function removeDocumentListener(type: string, listener: EventListener) {
    originalDocumentRemoveEventListener(type, listener);
  };

  Object.assign(sandbox, {
    window: windowObject,
    self: windowObject,
    globalThis: windowObject,
    parent: windowObject,
    top: windowObject
  });

  return {
    state,
    document,
    sandbox,
    flushTimers() {
      let processed = 0;

      for (const entry of [...timers.values()]) {
        if (entry.cleared) {
          timers.delete(entry.id);
          continue;
        }

        entry.callback();
        state.timerExecutionCount += 1;
        processed += 1;

        if (!entry.repeat || processed >= MAX_FLUSHED_TIMERS) {
          timers.delete(entry.id);
        }
      }
    },
    flushAnimationFrames() {
      for (let iteration = 0; iteration < MAX_FLUSHED_ANIMATION_FRAMES; iteration += 1) {
        const pending = [...animationFrames.entries()];
        if (!pending.length) {
          break;
        }

        animationFrames.clear();

        for (const [, callback] of pending) {
          callback(Date.now());
        }
      }
    },
    clickLikelyStartButtons() {
      const buttons = document.querySelectorAll('button');
      const candidates = buttons.filter((button) => /(start|play|go|begin|retry|restart|\uC2DC\uC791|\uD50C\uB808\uC774|\uB2E4\uC2DC|\uC7AC\uC2DC\uC791)/i.test(button.textContent));
      for (const button of candidates) {
        state.clickedStartButtons += 1;
        button.click();
      }
    },
    exerciseLikelyGameplayInputs() {
      const baseEvent = {
        preventDefault() {},
        stopPropagation() {}
      };
      const keyEvents = [
        { type: 'keydown', key: 'ArrowLeft', code: 'ArrowLeft' },
        { type: 'keyup', key: 'ArrowLeft', code: 'ArrowLeft' },
        { type: 'keydown', key: 'Space', code: 'Space' },
        { type: 'keyup', key: 'Space', code: 'Space' }
      ];

      for (const event of keyEvents) {
        const payload = { ...baseEvent, ...event, target: windowObject, currentTarget: windowObject };
        windowObject.dispatchEvent(payload);
        document.dispatchEvent({ ...payload, target: document, currentTarget: document });
      }

      const pointerTargets = [document.querySelector('canvas'), document.body].filter((target): target is ElementStub => Boolean(target));
      for (const target of pointerTargets) {
        for (const type of ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'click']) {
          target.dispatchEvent({
            ...baseEvent,
            type,
            button: 0,
            clientX: Math.round(target.width / 2),
            clientY: Math.round(target.height / 2),
            target,
            currentTarget: target
          });
        }
      }
    }
  };
}

function hasGameplaySignals(html: string) {
  return /<canvas\b/i.test(html) || /\brequestAnimationFrame\b|\bsetInterval\b|\bgetContext\s*\(/.test(html);
}

export function assertAiGameHtmlPlayable(html: string): AiGamePlayabilityResult {
  const trimmedHtml = html.trim();
  if (!trimmedHtml) {
    throw new AiGamePlayabilityError('Generated HTML is empty.');
  }

  if (!hasGameplaySignals(trimmedHtml)) {
    throw new AiGamePlayabilityError('Generated HTML does not include a recognizable game surface or loop.');
  }

  if (hasOverlappingTopLeftScoreHud(trimmedHtml)) {
    throw new AiGamePlayabilityError('Generated game places the score HUD over the top-left play area. Keep score UI in a reserved bar/panel or pad the playfield so gameplay stays visible.');
  }

  const scripts = extractInlineScripts(trimmedHtml);
  if (!scripts.length) {
    throw new AiGamePlayabilityError('Generated HTML must include inline JavaScript.');
  }

  if (scripts.length > MAX_GENERATED_SCRIPT_COUNT) {
    throw new AiGamePlayabilityError('Generated HTML includes too many script blocks.');
  }

  const harness = createSmokeHarness(trimmedHtml);
  const context = vm.createContext(harness.sandbox);

  try {
    for (const [index, scriptBody] of scripts.entries()) {
      const script = new vm.Script(scriptBody, { filename: `generated-game-${index + 1}.js` });
      script.runInContext(context, { timeout: 1000 });
    }

    harness.document.readyState = 'interactive';
    const windowObject = harness.sandbox.window as EventTargetStub;
    harness.document.dispatchEvent({ type: 'DOMContentLoaded', target: harness.document, currentTarget: harness.document });
    windowObject.dispatchEvent({ type: 'load', target: windowObject, currentTarget: windowObject });
    harness.flushTimers();
    harness.flushAnimationFrames();
    harness.exerciseLikelyGameplayInputs();
    harness.flushTimers();
    harness.flushAnimationFrames();
    const preClickSnapshot = getPlayabilitySnapshot(harness.state);
    harness.clickLikelyStartButtons();
    harness.exerciseLikelyGameplayInputs();
    harness.flushTimers();
    harness.flushAnimationFrames();
    const postClickSnapshot = getPlayabilitySnapshot(harness.state);

    if (harness.state.clickedStartButtons > 0 && !hasStrongGameplayEvidence(preClickSnapshot) && !hasStrongGameplayEvidence(postClickSnapshot)) {
      throw new AiGamePlayabilityError('Generated game shows a start button but does not begin playable behavior after it is clicked.');
    }

    if (harness.state.clickedStartButtons > 0 && !hasStrongGameplayEvidence(preClickSnapshot) && !snapshotChanged(preClickSnapshot, postClickSnapshot)) {
      throw new AiGamePlayabilityError('Generated game start controls do not trigger any gameplay initialization.');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown runtime error.';
    throw new AiGamePlayabilityError(`Generated game failed the runtime smoke test: ${message}`);
  }

  if (!hasStrongGameplayEvidence(getPlayabilitySnapshot(harness.state))) {
    throw new AiGamePlayabilityError('Generated game did not initialize a real playable loop or input flow.');
  }

  return {
    scriptCount: scripts.length,
    animationFrameRequests: harness.state.animationFrameRequests,
    canvasContextRequests: harness.state.canvasContextRequests,
    submittedScores: [...harness.state.submittedScores]
  };
}


