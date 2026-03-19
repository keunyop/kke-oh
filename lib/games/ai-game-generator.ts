import { createPlaceholderThumbnail } from '@/lib/games/placeholder';
import { injectLeaderboardBridge } from '@/lib/games/score-bridge';
import type { UploadedFile } from '@/lib/games/upload';

type GeneratedGamePayload = {
  title: string;
  description: string;
  html: string;
  thumbnailSvg: string;
};

type GeneratedGame = {
  title: string;
  description: string;
  html: string;
  thumbnail: UploadedFile;
};

export type CreateGamePromptInput = {
  gameDescription: string;
};

export type EditGamePromptInput = {
  request: string;
  existingGameTitle?: string | null;
  existingGameDescription?: string | null;
  existingGameHtml?: string | null;
};

export type GameGeneratorPromptInput = CreateGamePromptInput;

const OPENAI_API_URL = 'https://api.openai.com/v1/responses';
const OPENAI_MODEL = process.env.OPENAI_GAME_MODEL?.trim() || 'gpt-4.1-mini';
const SECTION_BAR = '\u2501'.repeat(19);

const CREATE_GAME_SYSTEM_PROMPT = [
  'You are an expert HTML5 game developer specializing in small, highly engaging browser games.',
  '',
  'Your job is to generate COMPLETE, PLAYABLE, and BUG-FREE games.',
  '',
  SECTION_BAR,
  '# CORE RULES',
  SECTION_BAR,
  '- Always generate a FULLY WORKING game (never partial or placeholder code)',
  '- The game must run immediately when opened in a browser',
  '- Do NOT omit any required logic (game loop, collision, restart, etc.)',
  '- Do NOT include explanations, comments, or markdown outside the code',
  '- Output ONLY a single HTML file',
  '',
  SECTION_BAR,
  '# TECHNICAL CONSTRAINTS',
  SECTION_BAR,
  '- Single file only (HTML + CSS + JS combined)',
  '- Use vanilla JavaScript only (no frameworks, no external libraries)',
  '- No external assets (no CDN, no external images, no fonts)',
  '- All assets must be generated in code (canvas, shapes, etc.)',
  '- Must run offline',
  '',
  SECTION_BAR,
  '# REQUIRED GAME STRUCTURE',
  SECTION_BAR,
  'Every game MUST include:',
  '',
  '1. Start Screen',
  '   - Title',
  '   - Start button',
  '',
  '2. Game Loop',
  '   - update()',
  '   - render()',
  '   - requestAnimationFrame',
  '',
  '3. Player Controls',
  '   - Keyboard input (or clearly defined alternative)',
  '',
  '4. Core Mechanics',
  '   - Movement',
  '   - Collision detection',
  '   - Score tracking',
  '',
  '5. Difficulty Scaling',
  '   - Game becomes harder over time',
  '',
  '6. Game Over State',
  '   - Clear fail condition',
  '   - Final score display',
  '',
  '7. Restart System',
  '   - Restart button',
  '   - Fully reset game state',
  '',
  SECTION_BAR,
  '# GAME DESIGN PRINCIPLES',
  SECTION_BAR,
  '- Simple to learn within 5 seconds',
  '- Clear objective and feedback',
  '- Immediate response to user input',
  '- Increasing challenge over time',
  '- Avoid unnecessary complexity',
  '- Prioritize smooth gameplay over visual polish',
  '',
  SECTION_BAR,
  '# QUALITY CONTROL (MANDATORY)',
  SECTION_BAR,
  'Before finalizing output, internally verify:',
  '- No syntax errors',
  '- Game runs without crashing',
  '- Restart works correctly',
  '- Score updates correctly',
  '- Difficulty actually increases',
  '- Player can lose (fail condition exists)',
  '',
  'If any of the above is not satisfied, FIX IT before returning.',
  '',
  SECTION_BAR,
  '# OUTPUT FORMAT (STRICT)',
  SECTION_BAR,
  '- Return ONLY raw HTML code',
  '- No markdown (no ```), no explanations, no extra text'
].join('\n');

const EDIT_GAME_SYSTEM_PROMPT = [
  'You are an expert HTML5 game developer specializing in updating existing browser games.',
  '',
  'Your job is to read the current game, apply the requested changes, and return a COMPLETE, PLAYABLE, and BUG-FREE updated game.',
  '',
  SECTION_BAR,
  '# CORE RULES',
  SECTION_BAR,
  '- Always return a FULLY WORKING updated game (never partial code, diffs, or placeholders)',
  '- Read the current game details carefully before changing anything',
  '- Keep existing behavior that still fits unless the user asked to change it',
  '- Do NOT omit required logic such as the game loop, restart flow, collision, or scoring',
  '- Do NOT include explanations, comments, or markdown outside the code',
  '- Return the full replacement HTML for the game',
  '',
  SECTION_BAR,
  '# TECHNICAL CONSTRAINTS',
  SECTION_BAR,
  '- Single file only (HTML + CSS + JS combined)',
  '- Use vanilla JavaScript only (no frameworks, no external libraries)',
  '- No external assets (no CDN, no external images, no fonts)',
  '- All assets must be generated in code (canvas, shapes, etc.)',
  '- Must run offline',
  '',
  SECTION_BAR,
  '# EDITING PRINCIPLES',
  SECTION_BAR,
  '- Preserve the game concept unless the request changes it',
  '- Make the requested changes feel integrated, not bolted on',
  '- Keep controls, UI, score flow, and restart behavior clear and reliable',
  '- If a requested change conflicts with the current implementation, resolve it in the simplest playable way',
  '',
  SECTION_BAR,
  '# QUALITY CONTROL (MANDATORY)',
  SECTION_BAR,
  'Before finalizing output, internally verify:',
  '- No syntax errors',
  '- Updated game runs without crashing',
  '- Requested changes are actually present',
  '- Restart works correctly',
  '- Score updates correctly if the game uses scoring',
  '- The player can still understand how to play',
  '',
  'If any of the above is not satisfied, FIX IT before returning.',
  '',
  SECTION_BAR,
  '# OUTPUT FORMAT (STRICT)',
  SECTION_BAR,
  '- Return ONLY raw HTML code',
  '- No markdown (no ```), no explanations, no extra text'
].join('\n');

function extractTextOutput(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const data = payload as {
    output_text?: string;
    output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
  };

  if (typeof data.output_text === 'string' && data.output_text.trim()) {
    return data.output_text;
  }

  for (const output of data.output ?? []) {
    for (const content of output.content ?? []) {
      if (typeof content.text === 'string' && content.text.trim()) {
        return content.text;
      }
    }
  }

  return null;
}

function normalizeSvg(svg: string, title: string) {
  const trimmed = svg.trim();
  if (trimmed.startsWith('<svg')) {
    return trimmed;
  }

  return createPlaceholderThumbnail(title).content.toString('utf8');
}

function normalizePromptValue(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function normalizeCreatePromptInput(input: string | CreateGamePromptInput): CreateGamePromptInput {
  if (typeof input === 'string') {
    return { gameDescription: input };
  }

  return input;
}

function normalizeEditPromptInput(input: EditGamePromptInput): EditGamePromptInput {
  return input;
}

export function buildCreateGameSystemPrompt(): string {
  return CREATE_GAME_SYSTEM_PROMPT;
}

export function buildEditGameSystemPrompt(): string {
  return EDIT_GAME_SYSTEM_PROMPT;
}

export function buildCreateGameUserPrompt(input: string | CreateGamePromptInput): string {
  const options = normalizeCreatePromptInput(input);
  const gameDescription = normalizePromptValue(options.gameDescription) ?? 'Create a playful, replayable browser game.';

  return [
    'Create a complete playable HTML5 game based on the following game description.',
    '',
    SECTION_BAR,
    '# GAME DESCRIPTION',
    SECTION_BAR,
    gameDescription,
    '',
    SECTION_BAR,
    '# UI REQUIREMENTS',
    SECTION_BAR,
    '- Show score on screen',
    '- Display clear start screen',
    '- Display game over screen',
    '- Include restart button',
    '',
    SECTION_BAR,
    '# OUTPUT',
    SECTION_BAR,
    'Return ONLY a single HTML file.'
  ].join('\n');
}

export function buildEditGameUserPrompt(input: EditGamePromptInput): string {
  const options = normalizeEditPromptInput(input);
  const request = normalizePromptValue(options.request) ?? 'Improve the game while keeping it fully playable.';
  const currentTitle = normalizePromptValue(options.existingGameTitle) ?? 'Not provided';
  const currentDescription = normalizePromptValue(options.existingGameDescription) ?? 'Not provided';
  const currentHtml = normalizePromptValue(options.existingGameHtml) ?? 'Current game HTML was not available.';

  return [
    'Update the existing HTML5 game below and apply the requested changes.',
    '',
    SECTION_BAR,
    '# CURRENT GAME',
    SECTION_BAR,
    'Title:',
    currentTitle,
    '',
    'Description:',
    currentDescription,
    '',
    SECTION_BAR,
    '# CURRENT GAME FILE',
    SECTION_BAR,
    currentHtml,
    '',
    SECTION_BAR,
    '# REQUESTED CHANGES',
    SECTION_BAR,
    request,
    '',
    SECTION_BAR,
    '# EDITING RULES',
    SECTION_BAR,
    '- Keep the game fully playable after the update',
    '- Preserve parts of the current game that still fit the request',
    '- Return the FULL updated HTML, not a diff or partial snippet',
    '- Keep the UI readable and the controls understandable',
    '',
    SECTION_BAR,
    '# OUTPUT',
    SECTION_BAR,
    'Return ONLY a single HTML file.'
  ].join('\n');
}

async function generateGame({
  systemPrompt,
  userPrompt,
  modelName
}: {
  systemPrompt: string;
  userPrompt: string;
  modelName?: string;
}): Promise<GeneratedGame> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured.');
  }

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: modelName?.trim() || OPENAI_MODEL,
      input: [
        {
          role: 'system',
          content: [{ type: 'input_text', text: systemPrompt }]
        },
        {
          role: 'user',
          content: [{ type: 'input_text', text: userPrompt }]
        }
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'generated_game',
          strict: true,
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              title: { type: 'string', minLength: 2, maxLength: 60 },
              description: { type: 'string', minLength: 10, maxLength: 200 },
              html: { type: 'string', minLength: 200 },
              thumbnailSvg: { type: 'string', minLength: 50 }
            },
            required: ['title', 'description', 'html', 'thumbnailSvg']
          }
        }
      }
    })
  });

  const payload = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'error' in payload && payload.error && typeof payload.error === 'object' && 'message' in payload.error
        ? String(payload.error.message)
        : 'OpenAI request failed.';
    throw new Error(message);
  }

  const rawText = extractTextOutput(payload);
  if (!rawText) {
    throw new Error('OpenAI response did not include generated content.');
  }

  let generated: GeneratedGamePayload;
  try {
    generated = JSON.parse(rawText) as GeneratedGamePayload;
  } catch {
    throw new Error('OpenAI returned invalid JSON.');
  }

  if (!generated.title?.trim() || !generated.description?.trim() || !generated.html?.trim()) {
    throw new Error('OpenAI returned an incomplete game.');
  }

  return {
    title: generated.title.trim(),
    description: generated.description.trim(),
    html: injectLeaderboardBridge(generated.html.trim()),
    thumbnail: {
      path: 'thumbnail.svg',
      content: Buffer.from(normalizeSvg(generated.thumbnailSvg, generated.title), 'utf8'),
      contentType: 'image/svg+xml'
    }
  };
}

export async function generateGameFromCreatePrompt(prompt: string | CreateGamePromptInput, modelName?: string): Promise<GeneratedGame> {
  return generateGame({
    systemPrompt: buildCreateGameSystemPrompt(),
    userPrompt: buildCreateGameUserPrompt(prompt),
    modelName
  });
}

export async function generateGameFromEditPrompt(prompt: EditGamePromptInput, modelName?: string): Promise<GeneratedGame> {
  return generateGame({
    systemPrompt: buildEditGameSystemPrompt(),
    userPrompt: buildEditGameUserPrompt(prompt),
    modelName
  });
}

export async function generateGameFromPrompt(prompt: string | CreateGamePromptInput, modelName?: string): Promise<GeneratedGame> {
  return generateGameFromCreatePrompt(prompt, modelName);
}
