'use client';

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent, type RefObject } from 'react';
import { useRouter } from 'next/navigation';
import { AiProgressCard } from '@/components/ai/ai-progress-card';
import type { Locale } from '@/lib/i18n';

type CreationMode = 'ai' | 'manual';
type ManualMode = 'html' | 'zip';

type InspectResponse = {
  inspectionId: string;
  entryPath: string;
  htmlFiles: string[];
  thumbnailCandidates: string[];
  allowlistViolation: boolean;
};

type PublishResponse = {
  ok: true;
  gameId: string;
  gameUrl: string;
  flagged: boolean;
  pointsSpent?: number;
};

type SlugCheckResponse = {
  slug?: string;
  available?: boolean;
  issue?: 'invalid' | 'taken' | null;
  error?: string;
};

type ErrorResponse = {
  error?: string;
};

type AiModel = {
  id: string;
  label: string;
  provider: string;
  modelName: string;
  kidDescription: string;
  pointCostCreate: number;
  pointCostEdit: number;
};

type AiModelsResponse = {
  models?: AiModel[];
  balance?: number;
  error?: string;
};

type SlugState = {
  checkedValue: string;
  slug: string;
  available: boolean | null;
  issue: 'invalid' | 'taken' | null;
  message: string | null;
};

const AI_PROGRESS_STEP_DELAYS = [8000, 26000, 52000, 78000] as const;

function tx(locale: Locale, ko: string, en: string) {
  return locale === 'ko' ? ko : en;
}

function suggestSlug(value: string) {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase()
    .trim()
    .replace(/[\'"`]+/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

function FileDropzone({
  inputId,
  accept,
  label,
  hint,
  file,
  onFileChange,
  inputRef,
  locale
}: {
  inputId: string;
  accept: string;
  label: string;
  hint?: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
  inputRef: RefObject<HTMLInputElement>;
  locale: Locale;
}) {
  const [isDragging, setIsDragging] = useState(false);

  function assignFileList(list: FileList | null) {
    onFileChange(list?.[0] ?? null);
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    assignFileList(event.target.files);
  }

  function handleDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setIsDragging(false);
    assignFileList(event.dataTransfer.files);
  }

  return (
    <label className="field-label">
      <span>{label}</span>
      <input ref={inputRef} id={inputId} type="file" accept={accept} onChange={handleInputChange} className="sr-only" />
      <button
        type="button"
        className={`file-dropzone${isDragging ? ' is-dragging' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          const nextTarget = event.relatedTarget;
          if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) {
            setIsDragging(false);
          }
        }}
        onDrop={handleDrop}
      >
        <strong>{tx(locale, isDragging ? '여기에 파일을 놓아주세요' : '파일 고르기', isDragging ? 'Drop the file here' : 'Choose file')}</strong>
        <span>{tx(locale, '또는 여기로 끌어다 놓기', 'or drop it here')}</span>
      </button>
      {file ? (
        <div className="file-dropzone-meta">
          <span>
            {tx(locale, '선택한 파일', 'Selected file')}: {file.name}
          </span>
          <button
            type="button"
            className="button-ghost file-dropzone-clear"
            onClick={() => {
              onFileChange(null);
              if (inputRef.current) {
                inputRef.current.value = '';
              }
            }}
          >
            {tx(locale, '파일 비우기', 'Remove file')}
          </button>
        </div>
      ) : null}
      {hint ? <span className="small-copy upload-input-hint">{hint}</span> : null}
    </label>
  );
}

export default function SubmitForm({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [mode, setMode] = useState<CreationMode>('ai');
  const [manualMode, setManualMode] = useState<ManualMode>('html');
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const [aiTitle, setAiTitle] = useState('');
  const [aiSlug, setAiSlug] = useState('');
  const [aiSlugEdited, setAiSlugEdited] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiDescription, setAiDescription] = useState('');
  const [aiThumbnail, setAiThumbnail] = useState<File | null>(null);
  const [aiModels, setAiModels] = useState<AiModel[]>([]);
  const [aiModelId, setAiModelId] = useState('');

  const [manualTitle, setManualTitle] = useState('');
  const [manualSlug, setManualSlug] = useState('');
  const [manualSlugEdited, setManualSlugEdited] = useState(false);
  const [manualDescription, setManualDescription] = useState('');
  const [manualLeaderboardEnabled, setManualLeaderboardEnabled] = useState(false);
  const [htmlFile, setHtmlFile] = useState<File | null>(null);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [manualThumbnail, setManualThumbnail] = useState<File | null>(null);
  const [inspectResult, setInspectResult] = useState<InspectResponse | null>(null);

  const [pointBalance, setPointBalance] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isInspecting, setIsInspecting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [aiProgressStep, setAiProgressStep] = useState(0);
  const [aiProgressDots, setAiProgressDots] = useState(1);
  const [slugState, setSlugState] = useState<SlugState>({ checkedValue: '', slug: '', available: null, issue: null, message: null });

  const htmlInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);
  const aiThumbnailInputRef = useRef<HTMLInputElement>(null);
  const manualThumbnailInputRef = useRef<HTMLInputElement>(null);

  const activeSlug = mode === 'ai' ? aiSlug : manualSlug;
  const selectedAiModel = useMemo(() => aiModels.find((model) => model.id === aiModelId) ?? aiModels[0] ?? null, [aiModelId, aiModels]);
  const aiPointCost = selectedAiModel?.pointCostCreate ?? 0;
  const aiPointShortage = aiPointCost > pointBalance;
  const isAiPublishing = mode === 'ai' && isPublishing;

  useEffect(() => {
    let cancelled = false;

    async function loadAiModels() {
      setIsLoadingModels(true);

      try {
        const response = await fetch('/api/ai/models', { cache: 'no-store' });
        const data = (await response.json()) as AiModelsResponse;

        if (!response.ok || !data.models?.length) {
          throw new Error(data.error ?? 'Could not load AI models.');
        }

        if (cancelled) {
          return;
        }

        setAiModels(data.models);
        setPointBalance(data.balance ?? 0);
        setAiModelId((current) => current || data.models?.[0]?.id || '');
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : 'Could not load AI models.');
        }
      } finally {
        if (!cancelled) {
          setIsLoadingModels(false);
        }
      }
    }

    void loadAiModels();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isAiPublishing) {
      setAiProgressStep(0);
      setAiProgressDots(1);
      return;
    }

    setAiProgressStep(0);
    setAiProgressDots(1);

    const timers = AI_PROGRESS_STEP_DELAYS.map((delay, index) => window.setTimeout(() => setAiProgressStep(index + 1), delay));
    const dotsTimer = window.setInterval(() => {
      setAiProgressDots((current) => (current % 3) + 1);
    }, 420);

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      window.clearInterval(dotsTimer);
    };
  }, [isAiPublishing]);

  useEffect(() => {
    const trimmedSlug = activeSlug.trim();
    if (!trimmedSlug) {
      setSlugState({ checkedValue: '', slug: '', available: null, issue: null, message: null });
      setIsCheckingSlug(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsCheckingSlug(true);

      try {
        const response = await fetch(`/api/upload/title-check?slug=${encodeURIComponent(trimmedSlug)}`, {
          method: 'GET',
          cache: 'no-store',
          signal: controller.signal
        });
        const data = (await response.json()) as SlugCheckResponse;

        if (!response.ok) {
          throw new Error(data.error ?? tx(locale, 'URL 게임 이름 형식이 올바르지 않아요.', 'That URL game name format is invalid.'));
        }

        const issue = data.available ? null : (data.issue ?? (data.slug ? 'taken' : 'invalid'));
        setSlugState({
          checkedValue: trimmedSlug,
          slug: data.slug ?? '',
          available: Boolean(data.available),
          issue,
          message: data.available
            ? tx(locale, '사용할 수 있는 URL 이름이에요.', 'This URL name is available.')
            : issue === 'taken'
              ? tx(locale, '이미 사용 중인 URL 이름이에요.', 'That URL name is already taken.')
              : tx(locale, 'URL 게임 이름 형식이 올바르지 않아요.', 'That URL game name format is invalid.')
        });
      } catch (cause) {
        if (cause instanceof DOMException && cause.name === 'AbortError') {
          return;
        }

        setSlugState({
          checkedValue: trimmedSlug,
          slug: '',
          available: false,
          issue: 'invalid',
          message: cause instanceof Error ? cause.message : tx(locale, 'URL 게임 이름 형식이 올바르지 않아요.', 'That URL game name format is invalid.')
        });
      } finally {
        setIsCheckingSlug(false);
      }
    }, 350);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [activeSlug, locale]);

  function clearMessages() {
    setError(null);
  }

  function handleAiTitleChange(nextTitle: string) {
    setAiTitle(nextTitle);
    if (!aiSlugEdited) {
      setAiSlug(suggestSlug(nextTitle));
    }
    clearMessages();
  }

  function handleManualTitleChange(nextTitle: string) {
    setManualTitle(nextTitle);
    if (!manualSlugEdited) {
      setManualSlug(suggestSlug(nextTitle));
    }
    clearMessages();
  }

  function handleAiSlugChange(nextSlug: string) {
    setAiSlug(nextSlug);
    setAiSlugEdited(nextSlug.trim().length > 0);
    clearMessages();
  }

  function handleManualSlugChange(nextSlug: string) {
    setManualSlug(nextSlug);
    setManualSlugEdited(nextSlug.trim().length > 0);
    clearMessages();
  }

  function isCurrentSlugAvailable(slug: string) {
    const trimmedSlug = slug.trim();
    return trimmedSlug.length > 0 && trimmedSlug === slugState.checkedValue && slugState.available === true;
  }

  function validateSlug(slug: string, required: boolean) {
    const trimmedSlug = slug.trim();

    if (!trimmedSlug) {
      return required ? tx(locale, 'URL 게임 이름을 입력해주세요.', 'Please enter the URL game name.') : null;
    }

    if (!isCurrentSlugAvailable(trimmedSlug)) {
      return slugState.issue === 'taken'
        ? tx(locale, '이미 사용 중인 URL 이름이에요.', 'That URL name is already taken.')
        : tx(locale, 'URL 게임 이름은 영어 소문자, 숫자, 하이픈만 사용할 수 있어요.', 'URL game names can use only lowercase English letters, numbers, and hyphens.');
    }

    return null;
  }

  function resetAiForm() {
    setAiTitle('');
    setAiSlug('');
    setAiSlugEdited(false);
    setAiPrompt('');
    setAiDescription('');
    setAiThumbnail(null);
    setSlugState({ checkedValue: '', slug: '', available: null, issue: null, message: null });
    if (aiThumbnailInputRef.current) {
      aiThumbnailInputRef.current.value = '';
    }
  }

  function resetManualForm() {
    setManualTitle('');
    setManualSlug('');
    setManualSlugEdited(false);
    setManualDescription('');
    setManualLeaderboardEnabled(false);
    setHtmlFile(null);
    setZipFile(null);
    setManualThumbnail(null);
    setInspectResult(null);
    setSlugState({ checkedValue: '', slug: '', available: null, issue: null, message: null });
    if (htmlInputRef.current) {
      htmlInputRef.current.value = '';
    }
    if (zipInputRef.current) {
      zipInputRef.current.value = '';
    }
    if (manualThumbnailInputRef.current) {
      manualThumbnailInputRef.current.value = '';
    }
  }

  async function refreshPointBalance() {
    try {
      const response = await fetch('/api/points/balance', { cache: 'no-store' });
      const data = (await response.json().catch(() => null)) as { balance?: number } | null;
      if (response.ok && typeof data?.balance === 'number') {
        setPointBalance(data.balance);
      }
    } catch {
      // Ignore refresh failures after a successful create flow.
    }
  }

  function validateAiForm() {
    if (aiTitle.trim() && (aiTitle.trim().length < 2 || aiTitle.trim().length > 80)) {
      setError(tx(locale, '보여줄 게임 이름을 입력해주세요.', 'Please enter the display game name.'));
      return false;
    }

    const slugError = validateSlug(aiSlug, Boolean(aiTitle.trim()));
    if (slugError) {
      setError(slugError);
      return false;
    }

    if (aiPrompt.trim().length < 8) {
      setError(tx(locale, '게임 아이디어를 8자 이상 적어주세요.', 'Please write at least 8 characters for the game idea.'));
      return false;
    }

    if (!selectedAiModel) {
      setError(tx(locale, 'AI 모델을 선택해주세요.', 'Please choose an AI model.'));
      return false;
    }

    return true;
  }

  function validateManualForm() {
    if (manualTitle.trim().length < 2 || manualTitle.trim().length > 80) {
      setError(tx(locale, '보여줄 게임 이름을 입력해주세요.', 'Please enter the display game name.'));
      return false;
    }

    const slugError = validateSlug(manualSlug, true);
    if (slugError) {
      setError(slugError);
      return false;
    }

    if (manualMode === 'html' && !htmlFile) {
      setError(tx(locale, 'HTML 파일을 선택해주세요.', 'Please choose an HTML file.'));
      return false;
    }

    if (manualMode === 'zip' && !zipFile) {
      setError(tx(locale, 'ZIP 파일을 선택해주세요.', 'Please choose a ZIP file.'));
      return false;
    }

    return true;
  }

  async function runZipInspection() {
    if (manualTitle.trim().length < 2 || manualTitle.trim().length > 80) {
      setError(tx(locale, '보여줄 게임 이름을 입력해주세요.', 'Please enter the display game name.'));
      return null;
    }

    const slugError = validateSlug(manualSlug, true);
    if (slugError) {
      setError(slugError);
      return null;
    }

    if (!zipFile) {
      setError(tx(locale, 'ZIP 파일을 선택해주세요.', 'Please choose a ZIP file.'));
      return null;
    }

    clearMessages();
    setIsInspecting(true);

    try {
      const formData = new FormData();
      formData.append('file', zipFile);

      const response = await fetch('/api/upload/zip-inspect', {
        method: 'POST',
        body: formData
      });

      const data = (await response.json()) as InspectResponse | ErrorResponse;
      if (!response.ok || !('inspectionId' in data)) {
        throw new Error(('error' in data ? data.error : undefined) ?? tx(locale, 'ZIP 파일을 확인할 수 없어요.', 'Could not inspect the ZIP file.'));
      }

      setInspectResult(data);
      return data;
    } catch (cause) {
      setInspectResult(null);
      setError(cause instanceof Error ? cause.message : tx(locale, 'ZIP 파일을 확인할 수 없어요.', 'Could not inspect the ZIP file.'));
      return null;
    } finally {
      setIsInspecting(false);
    }
  }

  async function publishAiGame() {
    if (!validateAiForm()) {
      return;
    }

    clearMessages();
    setIsPublishing(true);

    try {
      const formData = new FormData();
      if (aiTitle.trim()) {
        formData.append('title', aiTitle.trim());
      }
      if (aiSlug.trim()) {
        formData.append('slug', aiSlug.trim());
      }
      formData.append('prompt', aiPrompt.trim());
      formData.append('modelId', selectedAiModel?.id ?? '');
      if (aiDescription.trim()) {
        formData.append('description', aiDescription.trim());
      }
      if (aiThumbnail) {
        formData.append('thumbnail', aiThumbnail);
      }

      const response = await fetch('/api/upload/generate-v2', {
        method: 'POST',
        body: formData
      });

      const data = (await response.json()) as PublishResponse | ErrorResponse;
      if (!response.ok || !('ok' in data)) {
        throw new Error(('error' in data ? data.error : undefined) ?? tx(locale, '게임을 만들 수 없어요.', 'Could not create the game.'));
      }

      const nextGameName = aiTitle.trim() || data.gameId;
      resetAiForm();
      await refreshPointBalance();
      router.push(`/my-games?notice=created&game=${encodeURIComponent(nextGameName)}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : tx(locale, '게임을 만들 수 없어요.', 'Could not create the game.'));
    } finally {
      setIsPublishing(false);
    }
  }

  async function publishManualGame() {
    if (!validateManualForm()) {
      return;
    }

    clearMessages();
    setIsPublishing(true);

    try {
      if (manualMode === 'html') {
        const formData = new FormData();
        formData.append('title', manualTitle.trim());
        formData.append('slug', manualSlug.trim());
        formData.append('description', manualDescription.trim());
        formData.append('leaderboardEnabled', manualLeaderboardEnabled ? 'true' : 'false');
        if (htmlFile) {
          formData.append('htmlFile', htmlFile);
        }
        if (manualThumbnail) {
          formData.append('thumbnail', manualThumbnail);
        }

        const response = await fetch('/api/upload/paste', {
          method: 'POST',
          body: formData
        });

        const data = (await response.json()) as PublishResponse | ErrorResponse;
        if (!response.ok || !('ok' in data)) {
          throw new Error(('error' in data ? data.error : undefined) ?? tx(locale, '게임을 만들 수 없어요.', 'Could not create the game.'));
        }

        const nextGameName = manualTitle.trim();
        resetManualForm();
        router.push(`/my-games?notice=created&game=${encodeURIComponent(nextGameName)}`);
        return;
      }

      let inspection = inspectResult ?? (await runZipInspection());
      if (!inspection) {
        return;
      }

      let response = await fetch('/api/upload/confirm', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          inspectionId: inspection.inspectionId,
          title: manualTitle.trim(),
          slug: manualSlug.trim(),
          description: manualDescription.trim(),
          leaderboardEnabled: manualLeaderboardEnabled
        })
      });

      let data = (await response.json()) as PublishResponse | ErrorResponse;

      if (response.status === 410) {
        inspection = await runZipInspection();
        if (!inspection) {
          return;
        }

        response = await fetch('/api/upload/confirm', {
          method: 'POST',
          headers: {
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            inspectionId: inspection.inspectionId,
            title: manualTitle.trim(),
            slug: manualSlug.trim(),
            description: manualDescription.trim(),
            leaderboardEnabled: manualLeaderboardEnabled
          })
        });

        data = (await response.json()) as PublishResponse | ErrorResponse;
      }

      if (!response.ok || !('ok' in data)) {
        throw new Error(('error' in data ? data.error : undefined) ?? tx(locale, '게임을 만들 수 없어요.', 'Could not create the game.'));
      }

      const nextGameName = manualTitle.trim();
      resetManualForm();
      router.push(`/my-games?notice=created&game=${encodeURIComponent(nextGameName)}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : tx(locale, '게임을 만들 수 없어요.', 'Could not create the game.'));
    } finally {
      setIsPublishing(false);
    }
  }

  const aiProgressCopy =
    locale === 'ko'
      ? [
          '아이디어를 읽고 규칙을 정리하고 있어요.',
          '게임 화면과 조작을 만들고 있어요.',
          '점수와 흐름을 다듬고 있어요.',
          '썸네일과 설명을 정리하고 있어요.',
          '마지막 확인 후 저장하고 있어요.'
        ]
      : [
          'Reading your idea and planning the rules.',
          'Building the game screen and controls.',
          'Tuning scoring and game flow.',
          'Polishing the thumbnail and description.',
          'Running final checks and saving it.'
        ];

  return (
    <section className="panel-card panel-card-form submit-panel-simple">
      <div className="submit-main-mode-grid">
        <button
          type="button"
          className={`submit-choice-card${mode === 'ai' ? ' is-active' : ''}`}
          onClick={() => {
            setMode('ai');
            clearMessages();
          }}
        >
          <strong>{tx(locale, 'AI로 게임 만들기', 'Create with AI')}</strong>
          <span>{tx(locale, '아이디어를 적으면 AI가 바로 놀 수 있는 초안 게임을 만들어줘요.', 'Describe an idea and AI will turn it into a playable draft game.')}</span>
        </button>
        <button
          type="button"
          className={`submit-choice-card${mode === 'manual' ? ' is-active' : ''}`}
          onClick={() => {
            setMode('manual');
            clearMessages();
          }}
        >
          <strong>{tx(locale, '파일 올리기', 'Upload my files')}</strong>
          <span>{tx(locale, '직접 만든 HTML이나 ZIP 파일을 올려서 바로 등록할 수 있어요.', 'Upload an HTML file or a ZIP package you already made.')}</span>
        </button>
      </div>

      {mode === 'ai' ? (
        <div className="submit-section-stack">
          <label className="field-label">
            <span>{tx(locale, '어떤 게임을 만들고 싶나요?', 'What game should we make?')}</span>
            <textarea
              value={aiPrompt}
              onChange={(event) => setAiPrompt(event.target.value)}
              rows={5}
              maxLength={1200}
              placeholder={tx(locale, '예시: 우주에서 별을 피하고 코인을 모으는 쉬운 게임을 만들어줘.', 'Example: Make an easy space game where players dodge stars and collect coins.')}
            />
            <span className="small-copy upload-input-hint">{tx(locale, '짧게 적어도 괜찮아요. 캐릭터, 목표, 조작법 정도만 써도 시작할 수 있어요.', 'Short is okay. A character, a goal, and simple controls are enough to start.')}</span>
          </label>

          <button type="button" className="button-ghost submit-advanced-toggle" onClick={() => setAdvancedOpen((current) => !current)}>
            {advancedOpen ? tx(locale, '고급 설정 닫기', 'Hide advanced settings') : tx(locale, '고급 설정 열기', 'Show advanced settings')}
          </button>

          {advancedOpen ? (
            <div className="status-card submit-advanced-card">
              <div className="submit-inline-grid">
                <label className="field-label">
                  <span>{tx(locale, 'AI 모델', 'AI model')}</span>
                  <select value={aiModelId} onChange={(event) => setAiModelId(event.target.value)} disabled={isLoadingModels || isPublishing}>
                    {aiModels.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.label} · {model.modelName}
                      </option>
                    ))}
                  </select>
                  <span className="small-copy upload-input-hint">
                    {isLoadingModels ? tx(locale, '모델 목록을 불러오는 중이에요...', 'Loading AI models...') : selectedAiModel?.kidDescription ?? tx(locale, '모델 설명을 불러오는 중이에요.', 'Loading model description...')}
                  </span>
                </label>

                <div className="status-card submit-cost-card">
                  <p className="small-copy">{tx(locale, '현재 포인트', 'Current points')}</p>
                  <strong>{pointBalance}</strong>
                  <p className="small-copy">{tx(locale, '예상 차감', 'Expected cost')}</p>
                  <strong>{aiPointCost}</strong>
                  <p className="small-copy">{tx(locale, '이 버튼을 누르면 얼마나 쓰는지 미리 알려줘요.', 'This shows how many points this run will use.')}</p>
                  {aiPointShortage ? <p className="small-copy">{tx(locale, '테스트 기간이라 포인트가 부족해도 AI 게임 만들기를 계속 진행할 수 있어요.', 'During the test period, you can still create an AI game even if your points are low.')}</p> : null}
                </div>
              </div>
            </div>
          ) : null}

          <label className="field-label">
            <span>{tx(locale, '보여줄 게임 이름', 'Display game name')}</span>
            <input value={aiTitle} onChange={(event) => handleAiTitleChange(event.target.value)} maxLength={80} placeholder={tx(locale, '예시: 별 피하기 대모험', 'Example: Star Dodge Adventure')} />
            <span className="small-copy upload-input-hint">{tx(locale, '비워 두면 AI가 게임 이름도 제안해줘요.', 'Leave it empty if you want AI to suggest the game name too.')}</span>
          </label>

          <label className="field-label">
            <span>{tx(locale, 'URL 게임 이름', 'URL game name')}</span>
            <input value={aiSlug} onChange={(event) => handleAiSlugChange(event.target.value)} maxLength={80} placeholder="star-dodge-adventure" autoCapitalize="off" autoCorrect="off" spellCheck={false} />
          </label>

          <div className="submit-title-status">
            <span className="small-copy">{tx(locale, '영어 소문자, 숫자, 하이픈만 사용할 수 있어요.', 'Use lowercase English letters, numbers, and hyphens only.')}</span>
            {activeSlug.trim() ? <span className={`small-copy${slugState.issue || slugState.available === false ? ' error-text' : ''}`}>{isCheckingSlug ? tx(locale, 'URL 이름을 확인하는 중이에요...', 'Checking the URL name...') : slugState.message}</span> : null}
            {slugState.slug ? <span className="small-copy">{tx(locale, '게임 주소', 'Game URL')}: `/game/${slugState.slug}`</span> : null}
          </div>

          <label className="field-label">
            <span>{tx(locale, '게임 설명', 'Game description')}</span>
            <textarea value={aiDescription} onChange={(event) => setAiDescription(event.target.value)} rows={3} maxLength={400} placeholder={tx(locale, '예시: 별을 피하면서 코인을 모으는 게임', 'Example: Dodge stars and collect coins.')} />
            <span className="small-copy upload-input-hint">{tx(locale, '비워 두면 AI가 설명도 같이 만들어줘요.', 'Leave it empty if you want AI to write the description too.')}</span>
          </label>

          <FileDropzone
            inputId="ai-thumbnail-upload"
            accept="image/png,image/jpeg,image/webp"
            label={tx(locale, '썸네일 이미지', 'Thumbnail image')}
            hint={tx(locale, '비워 두면 AI가 만든 썸네일이나 기본 이미지를 사용해요.', 'If you skip this, we use the AI thumbnail or a default image.')}
            file={aiThumbnail}
            onFileChange={setAiThumbnail}
            inputRef={aiThumbnailInputRef}
            locale={locale}
          />

          {isAiPublishing ? <AiProgressCard title={tx(locale, 'AI가 게임을 만들고 있어요', 'AI is building your game')} detail={aiProgressCopy} step={aiProgressStep} dots={aiProgressDots} /> : null}

          <button type="button" className="button-primary button-fill" onClick={() => void publishAiGame()} disabled={isPublishing || isCheckingSlug || isLoadingModels}>
            {isPublishing ? tx(locale, '만드는 중...', 'Creating...') : tx(locale, 'AI로 게임 만들기', 'Create with AI')}
          </button>
        </div>
      ) : (
        <div className="submit-section-stack">
          <label className="field-label">
            <span>{tx(locale, '보여줄 게임 이름', 'Display game name')}</span>
            <input value={manualTitle} onChange={(event) => handleManualTitleChange(event.target.value)} maxLength={80} placeholder="Space Dodge" />
          </label>

          <label className="field-label">
            <span>{tx(locale, 'URL 게임 이름', 'URL game name')}</span>
            <input value={manualSlug} onChange={(event) => handleManualSlugChange(event.target.value)} maxLength={80} placeholder="space-dodge" autoCapitalize="off" autoCorrect="off" spellCheck={false} />
          </label>

          <div className="submit-title-status">
            <span className="small-copy">{tx(locale, '영어 소문자, 숫자, 하이픈만 사용할 수 있어요.', 'Use lowercase English letters, numbers, and hyphens only.')}</span>
            {activeSlug.trim() ? <span className={`small-copy${slugState.issue || slugState.available === false ? ' error-text' : ''}`}>{isCheckingSlug ? tx(locale, 'URL 이름을 확인하는 중이에요...', 'Checking the URL name...') : slugState.message}</span> : null}
            {slugState.slug ? <span className="small-copy">{tx(locale, '게임 주소', 'Game URL')}: `/game/${slugState.slug}`</span> : null}
          </div>

          <label className="field-label">
            <span>{tx(locale, '게임 설명', 'Game description')}</span>
            <textarea value={manualDescription} onChange={(event) => setManualDescription(event.target.value)} rows={3} maxLength={400} placeholder={tx(locale, '설명은 선택 사항이에요.', 'Description is optional.')} />
          </label>

          <label className="field-label">
            <span>{tx(locale, 'KKE-OH 리더보드 사용', 'Use KKE-OH leaderboard')}</span>
            <span className="toggle-row">
              <input type="checkbox" checked={manualLeaderboardEnabled} onChange={(event) => setManualLeaderboardEnabled(event.target.checked)} />
              <span className="small-copy">{tx(locale, '켜 두면 점수를 저장할 수 있도록 연결해줘요.', 'When enabled, we connect the score bridge for leaderboard support.')}</span>
            </span>
          </label>

          <div className="submit-submode-row">
            <button type="button" className={`button-ghost submit-submode-button${manualMode === 'html' ? ' is-active' : ''}`} onClick={() => { setManualMode('html'); setInspectResult(null); clearMessages(); }}>
              {tx(locale, 'HTML 올리기', 'Upload HTML')}
            </button>
            <button type="button" className={`button-ghost submit-submode-button${manualMode === 'zip' ? ' is-active' : ''}`} onClick={() => { setManualMode('zip'); setInspectResult(null); clearMessages(); }}>
              {tx(locale, 'ZIP 올리기', 'Upload ZIP')}
            </button>
          </div>

          {manualMode === 'html' ? (
            <>
              <FileDropzone
                inputId="html-upload"
                accept=".html,.htm,text/html"
                label={tx(locale, '게임을 시작하는 HTML 파일 1개를 올려주세요.', 'Upload one HTML file that starts the game.')}
                file={htmlFile}
                onFileChange={setHtmlFile}
                inputRef={htmlInputRef}
                locale={locale}
              />

              <FileDropzone
                inputId="manual-thumbnail-upload"
                accept="image/png,image/jpeg,image/webp"
                label={tx(locale, '썸네일 이미지', 'Thumbnail image')}
                hint={tx(locale, '비워 두면 기본 썸네일을 사용해요.', 'If you skip this, we will use a default thumbnail.')}
                file={manualThumbnail}
                onFileChange={setManualThumbnail}
                inputRef={manualThumbnailInputRef}
                locale={locale}
              />
            </>
          ) : (
            <>
              <FileDropzone
                inputId="zip-upload"
                accept=".zip,application/zip"
                label={tx(locale, 'HTML, 이미지, 소리가 함께 들어 있는 ZIP을 올려주세요.', 'Upload a ZIP that includes HTML and any images or sounds inside.')}
                hint={tx(locale, 'ZIP에서는 index.html과 thumbnail 파일을 먼저 찾아서 사용해요.', 'For ZIP uploads, we first look for index.html and thumbnail files automatically.')}
                file={zipFile}
                onFileChange={(file) => {
                  setZipFile(file);
                  setInspectResult(null);
                  clearMessages();
                }}
                inputRef={zipInputRef}
                locale={locale}
              />

              {inspectResult ? (
                <div className="status-card">
                  <p className="status-title">{tx(locale, 'ZIP 확인 완료', 'ZIP inspection complete')}</p>
                  <p className="small-copy">{tx(locale, '시작 파일', 'Start file')}: {inspectResult.entryPath}</p>
                  <p className="small-copy">{tx(locale, 'HTML 파일 수', 'HTML files')}: {inspectResult.htmlFiles.length}</p>
                  <p className="small-copy">{tx(locale, '썸네일 후보 수', 'Thumbnail candidates')}: {inspectResult.thumbnailCandidates.length}</p>
                  <p className="small-copy">
                    {inspectResult.allowlistViolation
                      ? tx(locale, '외부 링크가 보여서 업로드 후 다시 확인할 수 있어요.', 'We found an external link, so this upload may be reviewed again.')
                      : tx(locale, '외부 링크 문제는 보이지 않았어요.', 'No external link issue was found.')}
                  </p>
                </div>
              ) : null}
            </>
          )}

          <button type="button" className="button-primary button-fill" onClick={() => void publishManualGame()} disabled={isPublishing || isCheckingSlug || isInspecting}>
            {isInspecting ? tx(locale, 'ZIP 확인 중...', 'Checking ZIP...') : isPublishing ? tx(locale, '만드는 중...', 'Creating...') : tx(locale, '게임 만들기', 'Create game')}
          </button>
        </div>
      )}

      {error ? <p className="error-text">{error}</p> : null}
    </section>
  );
}


