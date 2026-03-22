'use client';

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent, type RefObject } from 'react';
import { useRouter } from 'next/navigation';
import { AiModelCompactPanel } from '@/app/ai-model-compact-panel';
import { AiProgressCard } from '@/components/ai/ai-progress-card';
import { PointShortageDialog } from '@/components/points/point-shortage-dialog';
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
  requiredPoints?: number;
  balance?: number;
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
        <strong>{tx(locale, isDragging ? 'Drop the file here' : 'Choose file', isDragging ? 'Drop the file here' : 'Choose file')}</strong>
        <span>{tx(locale, 'or drop it here', 'or drop it here')}</span>
      </button>
      {file ? (
        <div className="file-dropzone-meta">
          <span>
            {tx(locale, 'Selected file', 'Selected file')}: {file.name}
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
            {tx(locale, 'Remove file', 'Remove file')}
          </button>
        </div>
      ) : null}
      {hint ? <span className="small-copy upload-input-hint">{hint}</span> : null}
    </label>
  );
}

export default function SubmitForm({
  locale,
  initialAiPrompt = '',
  initialAiModelId = ''
}: {
  locale: Locale;
  initialAiPrompt?: string;
  initialAiModelId?: string;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<CreationMode>('ai');
  const [manualMode, setManualMode] = useState<ManualMode>('html');
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const [aiTitle, setAiTitle] = useState('');
  const [aiSlug, setAiSlug] = useState('');
  const [aiSlugEdited, setAiSlugEdited] = useState(false);
  const [aiPrompt, setAiPrompt] = useState(initialAiPrompt);
  const [aiDescription, setAiDescription] = useState('');
  const [aiThumbnail, setAiThumbnail] = useState<File | null>(null);
  const [aiModels, setAiModels] = useState<AiModel[]>([]);
  const [aiModelId, setAiModelId] = useState(initialAiModelId);

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
  const [shortageDialogOpen, setShortageDialogOpen] = useState(false);
  const [shortageRequiredPoints, setShortageRequiredPoints] = useState(0);
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

        const models = data.models;
        setAiModels(models);
        setPointBalance(data.balance ?? 0);
        setAiModelId((current) => {
          if (current && models.some((model) => model.id === current)) {
            return current;
          }

          const requestedModel = models.find((model) => model.id === initialAiModelId);
          return requestedModel?.id ?? models[0]?.id ?? '';
        });
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
  }, [initialAiModelId]);

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
          throw new Error(data.error ?? tx(locale, 'That URL game name format is invalid.', 'That URL game name format is invalid.'));
        }

        const issue = data.available ? null : (data.issue ?? (data.slug ? 'taken' : 'invalid'));
        setSlugState({
          checkedValue: trimmedSlug,
          slug: data.slug ?? '',
          available: Boolean(data.available),
          issue,
          message: data.available
            ? tx(locale, 'This URL name is available.', 'This URL name is available.')
            : issue === 'taken'
              ? tx(locale, 'That URL name is already taken.', 'That URL name is already taken.')
              : tx(locale, 'That URL game name format is invalid.', 'That URL game name format is invalid.')
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
          message: cause instanceof Error ? cause.message : tx(locale, 'That URL game name format is invalid.', 'That URL game name format is invalid.')
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
      return required ? tx(locale, 'Please enter the URL game name.', 'Please enter the URL game name.') : null;
    }

    if (!isCurrentSlugAvailable(trimmedSlug)) {
      return slugState.issue === 'taken'
        ? tx(locale, 'That URL name is already taken.', 'That URL name is already taken.')
        : tx(locale, 'URL game names can use only lowercase English letters, numbers, and hyphens.', 'URL game names can use only lowercase English letters, numbers, and hyphens.');
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
        return data.balance;
      }
    } catch {
      // Ignore refresh failures after a successful create flow.
    }

    return null;
  }

  function openPointShortageDialog(requiredPoints: number, balance = pointBalance) {
    setPointBalance(balance);
    setShortageRequiredPoints(requiredPoints);
    setShortageDialogOpen(true);
  }

  async function ensureEnoughAiPoints(requiredPoints: number) {
    const latestBalance = await refreshPointBalance();
    const nextBalance = latestBalance ?? pointBalance;

    if (requiredPoints > nextBalance) {
      openPointShortageDialog(requiredPoints, nextBalance);
      return false;
    }

    return true;
  }

  function validateAiForm() {
    if (aiTitle.trim() && (aiTitle.trim().length < 2 || aiTitle.trim().length > 80)) {
      setError(tx(locale, 'Please enter the display game name.', 'Please enter the display game name.'));
      return false;
    }

    const slugError = validateSlug(aiSlug, Boolean(aiTitle.trim()));
    if (slugError) {
      setError(slugError);
      return false;
    }

    if (aiPrompt.trim().length < 8) {
      setError(tx(locale, 'Please write at least 8 characters for the game idea.', 'Please write at least 8 characters for the game idea.'));
      return false;
    }

    if (!selectedAiModel) {
      setError(tx(locale, 'Please choose an AI model.', 'Please choose an AI model.'));
      return false;
    }

    return true;
  }

  function validateManualForm() {
    if (manualTitle.trim().length < 2 || manualTitle.trim().length > 80) {
      setError(tx(locale, 'Please enter the display game name.', 'Please enter the display game name.'));
      return false;
    }

    const slugError = validateSlug(manualSlug, true);
    if (slugError) {
      setError(slugError);
      return false;
    }

    if (manualMode === 'html' && !htmlFile) {
      setError(tx(locale, 'Please choose an HTML file.', 'Please choose an HTML file.'));
      return false;
    }

    if (manualMode === 'zip' && !zipFile) {
      setError(tx(locale, 'Please choose a ZIP file.', 'Please choose a ZIP file.'));
      return false;
    }

    return true;
  }

  async function runZipInspection() {
    if (manualTitle.trim().length < 2 || manualTitle.trim().length > 80) {
      setError(tx(locale, 'Please enter the display game name.', 'Please enter the display game name.'));
      return null;
    }

    const slugError = validateSlug(manualSlug, true);
    if (slugError) {
      setError(slugError);
      return null;
    }

    if (!zipFile) {
      setError(tx(locale, 'Please choose a ZIP file.', 'Please choose a ZIP file.'));
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
        throw new Error(('error' in data ? data.error : undefined) ?? tx(locale, 'Could not inspect the ZIP file.', 'Could not inspect the ZIP file.'));
      }

      setInspectResult(data);
      return data;
    } catch (cause) {
      setInspectResult(null);
      setError(cause instanceof Error ? cause.message : tx(locale, 'Could not inspect the ZIP file.', 'Could not inspect the ZIP file.'));
      return null;
    } finally {
      setIsInspecting(false);
    }
  }

  async function publishAiGame() {
    if (!validateAiForm()) {
      return;
    }

    if (!(await ensureEnoughAiPoints(aiPointCost))) {
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
        const errorData = data as ErrorResponse;

        if (typeof errorData.balance === 'number') {
          setPointBalance(errorData.balance);
        }

        if (typeof errorData.requiredPoints === 'number') {
          openPointShortageDialog(errorData.requiredPoints, typeof errorData.balance === 'number' ? errorData.balance : pointBalance);
          return;
        }

        throw new Error(errorData.error ?? tx(locale, 'Could not create the game.', 'Could not create the game.'));
      }

      const nextGameName = aiTitle.trim() || data.gameId;
      resetAiForm();
      await refreshPointBalance();
      router.push(`/my-games?notice=created&game=${encodeURIComponent(nextGameName)}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : tx(locale, 'Could not create the game.', 'Could not create the game.'));
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
          throw new Error(('error' in data ? data.error : undefined) ?? tx(locale, 'Could not create the game.', 'Could not create the game.'));
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
        throw new Error(('error' in data ? data.error : undefined) ?? tx(locale, 'Could not create the game.', 'Could not create the game.'));
      }

      const nextGameName = manualTitle.trim();
      resetManualForm();
      router.push(`/my-games?notice=created&game=${encodeURIComponent(nextGameName)}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : tx(locale, 'Could not create the game.', 'Could not create the game.'));
    } finally {
      setIsPublishing(false);
    }
  }

  const aiProgressCopy =
    locale === 'ko'
      ? [
          'Reading your idea and planning the rules.',
          'Building the game screen and controls.',
          'Tuning scoring and game flow.',
          'Polishing the thumbnail and description.',
          'Running final checks and saving it.'
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
          <strong>{tx(locale, 'Create with AI', 'Create with AI')}</strong>
          <span>{tx(locale, 'Describe an idea and AI will turn it into a playable draft game.', 'Describe an idea and AI will turn it into a playable draft game.')}</span>
        </button>
        <button
          type="button"
          className={`submit-choice-card${mode === 'manual' ? ' is-active' : ''}`}
          onClick={() => {
            setMode('manual');
            clearMessages();
          }}
        >
          <strong>{tx(locale, 'Upload my files', 'Upload my files')}</strong>
          <span>{tx(locale, 'Upload an HTML file or a ZIP package you already made.', 'Upload an HTML file or a ZIP package you already made.')}</span>
        </button>
      </div>

      {mode === 'ai' ? (
        <div className="submit-section-stack">
          <label className="field-label">
            <span>{tx(locale, 'What game should we make?', 'What game should we make?')}</span>
            <textarea
              value={aiPrompt}
              onChange={(event) => setAiPrompt(event.target.value)}
              rows={5}
              maxLength={1200}
              placeholder={tx(locale, 'Example: Make an easy space game where players dodge stars and collect coins.', 'Example: Make an easy space game where players dodge stars and collect coins.')}
            />
            <span className="small-copy upload-input-hint">{tx(locale, 'Short is okay. A character, a goal, and simple controls are enough to start.', 'Short is okay. A character, a goal, and simple controls are enough to start.')}</span>
          </label>

          <AiModelCompactPanel
            locale={locale}
            modelId={aiModelId}
            models={aiModels}
            pointBalance={pointBalance}
            pointCost={aiPointCost}
            pending={isPublishing}
            isLoading={isLoadingModels}
            isShortage={aiPointShortage}
            onChange={setAiModelId}
            shortageCopy={tx(locale, '포인트가 부족해요. 만들기 버튼을 누르면 바로 충전할 수 있어요.', 'Not enough points. Press create to open the point shop.')}
          />

          <div className="submit-inline-grid submit-inline-grid-legacy" aria-hidden="true">
            <label className="field-label">
              <span>{tx(locale, 'AI model', 'AI model')}</span>
              <select value={aiModelId} onChange={(event) => setAiModelId(event.target.value)} disabled={isLoadingModels || isPublishing}>
                {aiModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.label}
                  </option>
                ))}
              </select>
              <span className="small-copy upload-input-hint">
                {isLoadingModels ? tx(locale, 'Loading AI models...', 'Loading AI models...') : selectedAiModel?.kidDescription ?? tx(locale, 'Loading model description...', 'Loading model description...')}
              </span>
            </label>

            <div className="status-card submit-cost-card">
              <p className="small-copy">{tx(locale, 'Current points', 'Current points')}</p>
              <strong>{pointBalance}</strong>
              <p className="small-copy">{tx(locale, 'Expected cost', 'Expected cost')}</p>
              <strong>{aiPointCost}</strong>
              <p className="small-copy">{tx(locale, 'This shows how many points this run will use.', 'This shows how many points this run will use.')}</p>
              {aiPointShortage ? <p className="small-copy">{tx(locale, '포인트가 부족하면 만들기 버튼에서 바로 충전할 수 있어요.', 'If you are low on points, the create button opens the point shop right away.')}</p> : null}
            </div>
          </div>

          <button type="button" className="button-ghost submit-advanced-toggle" onClick={() => setAdvancedOpen((current) => !current)}>
            {advancedOpen ? tx(locale, 'Hide advanced settings', 'Hide advanced settings') : tx(locale, 'Show advanced settings', 'Show advanced settings')}
          </button>

          {advancedOpen ? (
            <div className="status-card submit-advanced-card">
              <label className="field-label">
                <span>{tx(locale, 'Display game name', 'Display game name')}</span>
                <input value={aiTitle} onChange={(event) => handleAiTitleChange(event.target.value)} maxLength={80} placeholder={tx(locale, 'Example: Star Dodge Adventure', 'Example: Star Dodge Adventure')} />
                <span className="small-copy upload-input-hint">{tx(locale, 'Leave it empty if you want AI to suggest the game name too.', 'Leave it empty if you want AI to suggest the game name too.')}</span>
              </label>

              <label className="field-label">
                <span>{tx(locale, 'URL game name', 'URL game name')}</span>
                <input value={aiSlug} onChange={(event) => handleAiSlugChange(event.target.value)} maxLength={80} placeholder="star-dodge-adventure" autoCapitalize="off" autoCorrect="off" spellCheck={false} />
              </label>

              <div className="submit-title-status">
                <span className="small-copy">{tx(locale, 'Use lowercase English letters, numbers, and hyphens only.', 'Use lowercase English letters, numbers, and hyphens only.')}</span>
                {activeSlug.trim() ? <span className={`small-copy${slugState.issue || slugState.available === false ? ' error-text' : ''}`}>{isCheckingSlug ? tx(locale, 'Checking the URL name...', 'Checking the URL name...') : slugState.message}</span> : null}
                {slugState.slug ? <span className="small-copy">{tx(locale, 'Game URL', 'Game URL')}: `/game/${slugState.slug}`</span> : null}
              </div>

              <label className="field-label">
                <span>{tx(locale, 'Game description', 'Game description')}</span>
                <textarea value={aiDescription} onChange={(event) => setAiDescription(event.target.value)} rows={3} maxLength={400} placeholder={tx(locale, 'Example: Dodge stars and collect coins.', 'Example: Dodge stars and collect coins.')} />
                <span className="small-copy upload-input-hint">{tx(locale, 'Leave it empty if you want AI to write the description too.', 'Leave it empty if you want AI to write the description too.')}</span>
              </label>

              <FileDropzone
                inputId="ai-thumbnail-upload"
                accept="image/png,image/jpeg,image/webp"
                label={tx(locale, 'Thumbnail image', 'Thumbnail image')}
                hint={tx(locale, 'If you skip this, we use the AI thumbnail or a default image.', 'If you skip this, we use the AI thumbnail or a default image.')}
                file={aiThumbnail}
                onFileChange={setAiThumbnail}
                inputRef={aiThumbnailInputRef}
                locale={locale}
              />
            </div>
          ) : null}
          {isAiPublishing ? <AiProgressCard title={tx(locale, 'AI is building your game', 'AI is building your game')} detail={aiProgressCopy} step={aiProgressStep} dots={aiProgressDots} /> : null}

          <button type="button" className="button-primary button-fill" onClick={() => void publishAiGame()} disabled={isPublishing || isCheckingSlug || isLoadingModels}>
            {isPublishing ? tx(locale, 'Creating...', 'Creating...') : tx(locale, 'Create with AI', 'Create with AI')}
          </button>
        </div>
      ) : (
        <div className="submit-section-stack">
          <label className="field-label">
            <span>{tx(locale, 'Display game name', 'Display game name')}</span>
            <input value={manualTitle} onChange={(event) => handleManualTitleChange(event.target.value)} maxLength={80} placeholder="Space Dodge" />
          </label>

          <label className="field-label">
            <span>{tx(locale, 'URL game name', 'URL game name')}</span>
            <input value={manualSlug} onChange={(event) => handleManualSlugChange(event.target.value)} maxLength={80} placeholder="space-dodge" autoCapitalize="off" autoCorrect="off" spellCheck={false} />
          </label>

          <div className="submit-title-status">
            <span className="small-copy">{tx(locale, 'Use lowercase English letters, numbers, and hyphens only.', 'Use lowercase English letters, numbers, and hyphens only.')}</span>
            {activeSlug.trim() ? <span className={`small-copy${slugState.issue || slugState.available === false ? ' error-text' : ''}`}>{isCheckingSlug ? tx(locale, 'Checking the URL name...', 'Checking the URL name...') : slugState.message}</span> : null}
            {slugState.slug ? <span className="small-copy">{tx(locale, 'Game URL', 'Game URL')}: `/game/${slugState.slug}`</span> : null}
          </div>

          <label className="field-label">
            <span>{tx(locale, 'Game description', 'Game description')}</span>
            <textarea value={manualDescription} onChange={(event) => setManualDescription(event.target.value)} rows={3} maxLength={400} placeholder={tx(locale, 'Description is optional.', 'Description is optional.')} />
          </label>

          <label className="field-label">
            <span>{tx(locale, 'Use KKE-OH leaderboard', 'Use KKE-OH leaderboard')}</span>
            <span className="toggle-row">
              <input type="checkbox" checked={manualLeaderboardEnabled} onChange={(event) => setManualLeaderboardEnabled(event.target.checked)} />
              <span className="small-copy">{tx(locale, 'When enabled, we connect the score bridge for leaderboard support.', 'When enabled, we connect the score bridge for leaderboard support.')}</span>
            </span>
          </label>

          <div className="submit-submode-row">
            <button type="button" className={`button-ghost submit-submode-button${manualMode === 'html' ? ' is-active' : ''}`} onClick={() => { setManualMode('html'); setInspectResult(null); clearMessages(); }}>
              {tx(locale, 'Upload HTML', 'Upload HTML')}
            </button>
            <button type="button" className={`button-ghost submit-submode-button${manualMode === 'zip' ? ' is-active' : ''}`} onClick={() => { setManualMode('zip'); setInspectResult(null); clearMessages(); }}>
              {tx(locale, 'Upload ZIP', 'Upload ZIP')}
            </button>
          </div>

          {manualMode === 'html' ? (
            <>
              <FileDropzone
                inputId="html-upload"
                accept=".html,.htm,text/html"
                label={tx(locale, 'Upload one HTML file that starts the game.', 'Upload one HTML file that starts the game.')}
                file={htmlFile}
                onFileChange={setHtmlFile}
                inputRef={htmlInputRef}
                locale={locale}
              />

              <FileDropzone
                inputId="manual-thumbnail-upload"
                accept="image/png,image/jpeg,image/webp"
                label={tx(locale, 'Thumbnail image', 'Thumbnail image')}
                hint={tx(locale, 'If you skip this, we will use a default thumbnail.', 'If you skip this, we will use a default thumbnail.')}
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
                label={tx(locale, 'Upload a ZIP that includes HTML and any images or sounds inside.', 'Upload a ZIP that includes HTML and any images or sounds inside.')}
                hint={tx(locale, 'For ZIP uploads, we first look for index.html and thumbnail files automatically.', 'For ZIP uploads, we first look for index.html and thumbnail files automatically.')}
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
                  <p className="status-title">{tx(locale, 'ZIP inspection complete', 'ZIP inspection complete')}</p>
                  <p className="small-copy">{tx(locale, 'Start file', 'Start file')}: {inspectResult.entryPath}</p>
                  <p className="small-copy">{tx(locale, 'HTML files', 'HTML files')}: {inspectResult.htmlFiles.length}</p>
                  <p className="small-copy">{tx(locale, 'Thumbnail candidates', 'Thumbnail candidates')}: {inspectResult.thumbnailCandidates.length}</p>
                  <p className="small-copy">
                    {inspectResult.allowlistViolation
                      ? tx(locale, 'We found an external link, so this upload may be reviewed again.', 'We found an external link, so this upload may be reviewed again.')
                      : tx(locale, 'No external link issue was found.', 'No external link issue was found.')}
                  </p>
                </div>
              ) : null}
            </>
          )}

          <button type="button" className="button-primary button-fill" onClick={() => void publishManualGame()} disabled={isPublishing || isCheckingSlug || isInspecting}>
            {isInspecting ? tx(locale, 'Checking ZIP...', 'Checking ZIP...') : isPublishing ? tx(locale, 'Creating...', 'Creating...') : tx(locale, 'Create game', 'Create game')}
          </button>
        </div>
      )}

      {error ? <p className="error-text">{error}</p> : null}
      <PointShortageDialog
        open={shortageDialogOpen}
        locale={locale}
        pointBalance={pointBalance}
        requiredPoints={shortageRequiredPoints}
        onClose={() => setShortageDialogOpen(false)}
        onPurchased={(balance) => setPointBalance(balance)}
      />
    </section>
  );
}
