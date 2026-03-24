'use client';

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent, type RefObject } from 'react';
import Image from 'next/image';
import { AiModelCompactPanel } from '@/app/ai-model-compact-panel';
import { AiProgressCard } from '@/components/ai/ai-progress-card';
import { PointShortageDialog } from '@/components/points/point-shortage-dialog';
import { getGameAssetUrl } from '@/lib/games/urls';
import { getPlaceholderThumbnailDataUrl } from '@/lib/games/placeholder';
import type { GameRecord } from '@/lib/games/types';
import type { Locale } from '@/lib/i18n';

type EditMode = 'ai' | 'html' | 'zip';

type Props = {
  game: GameRecord;
  locale: Locale;
};

type ApiResponse = {
  ok?: boolean;
  error?: string;
  requiredPoints?: number;
  balance?: number;
  game?: GameRecord | null;
  gameUrl?: string;
};

type AiModel = {
  id: string;
  label: string;
  modelName: string;
  kidDescription?: string;
  pointCostEdit: number;
};

type AiModelsResponse = {
  models?: AiModel[];
  balance?: number;
  error?: string;
};

const AI_PROGRESS_STEP_DELAYS = [7000, 20000, 42000, 64000] as const;

function text(locale: Locale, ko: string, en: string) {
  return locale === 'ko' ? ko : en;
}

function FileDropzone({
  inputId,
  accept,
  label,
  hint,
  file,
  onFileChange,
  inputRef
}: {
  inputId: string;
  accept: string;
  label: string;
  hint?: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
  inputRef: RefObject<HTMLInputElement>;
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
        <strong>{isDragging ? 'Drop the file here' : 'Choose file'}</strong>
        <span>or drop it here</span>
      </button>
      {file ? (
        <div className="file-dropzone-meta">
          <span>Selected file: {file.name}</span>
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
            Remove file
          </button>
        </div>
      ) : null}
      {hint ? <span className="small-copy upload-input-hint">{hint}</span> : null}
    </label>
  );
}

export function EditGameForm({ game, locale }: Props) {
  const [mode, setMode] = useState<EditMode>('ai');
  const [title, setTitle] = useState(game.title);
  const [description, setDescription] = useState(game.description);
  const [leaderboardEnabled, setLeaderboardEnabled] = useState(game.leaderboard_enabled);
  const [prompt, setPrompt] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [htmlFile, setHtmlFile] = useState<File | null>(null);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [models, setModels] = useState<AiModel[]>([]);
  const [modelId, setModelId] = useState('');
  const [pointBalance, setPointBalance] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [completedMode, setCompletedMode] = useState<EditMode | null>(null);
  const [gameUrl, setGameUrl] = useState(`/game/${game.slug}`);
  const [currentGame, setCurrentGame] = useState(game);
  const [aiProgressStep, setAiProgressStep] = useState(0);
  const [aiProgressDots, setAiProgressDots] = useState(1);
  const [shortageDialogOpen, setShortageDialogOpen] = useState(false);
  const [shortageRequiredPoints, setShortageRequiredPoints] = useState(0);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const htmlInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  const currentImageUrl = currentGame.thumbnail_path ? getGameAssetUrl(currentGame.id, currentGame.thumbnail_path) : getPlaceholderThumbnailDataUrl(currentGame.title);
  const selectedModel = useMemo(() => models.find((item) => item.id === modelId) ?? models[0] ?? null, [modelId, models]);
  const aiPointCost = selectedModel?.pointCostEdit ?? 0;
  const aiPointShortage = mode === 'ai' && aiPointCost > pointBalance;

  useEffect(() => {
    let cancelled = false;

    async function loadModels() {
      try {
        const response = await fetch('/api/ai/models', { cache: 'no-store' });
        const data = (await response.json()) as AiModelsResponse;
        if (!response.ok || !data.models?.length) {
          throw new Error(data.error ?? 'Could not load AI models.');
        }

        if (cancelled) {
          return;
        }

        setModels(data.models);
        setModelId(data.models[0]?.id ?? '');
        setPointBalance(data.balance ?? 0);
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : 'Could not load AI models.');
        }
      }
    }

    void loadModels();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!(mode === 'ai' && pending)) {
      setAiProgressStep(0);
      setAiProgressDots(1);
      return;
    }

    const timers = AI_PROGRESS_STEP_DELAYS.map((delay, index) => window.setTimeout(() => setAiProgressStep(index + 1), delay));
    const dotsTimer = window.setInterval(() => setAiProgressDots((current) => (current % 3) + 1), 420);

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      window.clearInterval(dotsTimer);
    };
  }, [mode, pending]);

  async function refreshBalance() {
    try {
      const response = await fetch('/api/points/balance', { cache: 'no-store' });
      const data = (await response.json()) as { balance?: number };
      if (response.ok && typeof data.balance === 'number') {
        setPointBalance(data.balance);
        return data.balance;
      }
    } catch {
      // Ignore balance refresh failures.
    }

    return null;
  }

  function openPointShortageDialog(requiredPoints: number, balance = pointBalance) {
    setPointBalance(balance);
    setShortageRequiredPoints(requiredPoints);
    setShortageDialogOpen(true);
  }

  async function ensureEnoughAiPoints(requiredPoints: number) {
    const latestBalance = await refreshBalance();
    const nextBalance = latestBalance ?? pointBalance;

    if (requiredPoints > nextBalance) {
      openPointShortageDialog(requiredPoints, nextBalance);
      return false;
    }

    return true;
  }

  async function submit() {
    if (mode === 'ai') {
      if (prompt.trim().length < 8) {
        setError(text(locale, 'AI 수정 요청은 8글자 이상 적어주세요.', 'Please write at least 8 characters for the AI update.'));
        return;
      }

      if (!selectedModel) {
        setError(text(locale, 'AI 도우미를 선택해주세요.', 'Please choose an AI helper.'));
        return;
      }

      if (!(await ensureEnoughAiPoints(aiPointCost))) {
        return;
      }
    }

    setPending(true);
    setError(null);
    setSuccess(null);
    setCompletedMode(null);

    try {
      const formData = new FormData();
      formData.append('mode', mode);
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('leaderboardEnabled', leaderboardEnabled ? 'true' : 'false');
      if (mode === 'ai') {
        formData.append('prompt', prompt.trim());
        formData.append('modelId', selectedModel?.id ?? '');
      }
      if (thumbnailFile) formData.append('thumbnail', thumbnailFile);
      if (htmlFile) formData.append('htmlFile', htmlFile);
      if (zipFile) formData.append('zipFile', zipFile);

      const response = await fetch(`/api/my-games/${currentGame.id}/edit`, {
        method: 'POST',
        body: formData
      });

      const data = (await response.json()) as ApiResponse;
      if (!response.ok || !data.ok || !data.game) {
        if (typeof data.balance === 'number') {
          setPointBalance(data.balance);
        }

        if (typeof data.requiredPoints === 'number') {
          openPointShortageDialog(data.requiredPoints, typeof data.balance === 'number' ? data.balance : pointBalance);
          return;
        }

        throw new Error(data.error ?? 'Could not update the game.');
      }

      setCurrentGame(data.game);
      setTitle(data.game.title);
      setDescription(data.game.description);
      setLeaderboardEnabled(data.game.leaderboard_enabled);
      setGameUrl(data.gameUrl ?? `/game/${data.game.slug}`);
      setThumbnailFile(null);
      setHtmlFile(null);
      setZipFile(null);
      setPrompt('');
      if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
      if (htmlInputRef.current) htmlInputRef.current.value = '';
      if (zipInputRef.current) zipInputRef.current.value = '';
      await refreshBalance();
      setSuccess(text(locale, '게임이 수정되었어요.', 'Your game was updated.'));
      setCompletedMode(mode);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update the game.');
    } finally {
      setPending(false);
    }
  }

  const modeCards: Array<{ key: EditMode; title: string; hint: string }> = [
    {
      key: 'ai',
      title: text(locale, 'AI로 다시 만들기', 'Edit with AI'),
      hint: text(locale, '바꾸고 싶은 점을 적고 바로 아래에서 AI 도우미를 골라주세요.', 'Describe the changes and pick the helper right below.')
    },
    {
      key: 'html',
      title: text(locale, 'HTML로 바꾸기', 'Replace with HTML'),
      hint: text(locale, '새 HTML 파일로 게임을 바꾸거나, 파일 없이 제목과 설명만 수정할 수 있어요.', 'Replace the game with a new HTML file, or just update the metadata.')
    },
    {
      key: 'zip',
      title: text(locale, 'ZIP으로 바꾸기', 'Replace with ZIP'),
      hint: text(locale, '새 ZIP 파일로 전체 게임을 바꾸거나, 파일 없이 정보만 수정할 수 있어요.', 'Replace the full game with a new ZIP, or just update the metadata.')
    }
  ];

  return (
    <section className="panel-card panel-card-form submit-panel-simple">
      <div className="edit-game-preview">
        <div className="edit-game-preview-media">
          <Image src={currentImageUrl} alt={currentGame.title} fill className="game-card-image" unoptimized />
        </div>
        <div className="edit-game-preview-copy">
          <p className="small-copy">{text(locale, '현재 게임', 'Current game')}</p>
          <h2>{currentGame.title}</h2>
          <p>{currentGame.description}</p>
          <p className="small-copy">{text(locale, '현재 링크', 'Current link')}: {gameUrl}</p>
        </div>
      </div>

      {error ? <p className="error-text">{error}</p> : null}
      {completedMode ? (
        <div className="status-card status-success edit-game-complete" role="status" aria-live="polite">
          <div className="edit-game-complete-copy">
            <p className="status-title">
              {completedMode === 'ai'
                ? text(locale, 'AI 수정이 끝났어요.', 'Your AI update is ready.')
                : text(locale, '게임 수정이 끝났어요.', 'Your game update is ready.')}
            </p>
            <p>
              {completedMode === 'ai'
                ? text(locale, '완성된 게임을 바로 플레이하거나 내 게임으로 돌아가서 다음 작업을 이어갈 수 있어요.', 'You can play the updated game now or head back to My Games for the next step.')
                : text(locale, '바뀐 게임을 바로 확인하거나 내 게임 목록으로 돌아갈 수 있어요.', 'You can open the updated game now or return to My Games.')}
            </p>
            {success ? <p className="small-copy">{success}</p> : null}
          </div>
          <div className="edit-game-complete-actions">
            <a href={gameUrl} className="button-primary">
              {text(locale, '게임 플레이', 'Play game')}
            </a>
            <a href={`/my-games?notice=updated&game=${encodeURIComponent(currentGame.title)}`} className="button-secondary">
              {text(locale, '내 게임으로 이동', 'Go to My Games')}
            </a>
          </div>
        </div>
      ) : success ? (
        <p className="admin-notice">{success}</p>
      ) : null}

      <div className="submit-section-stack">
        <label className="field-label">
          <span>{text(locale, '게임 이름', 'Game name')}</span>
          <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={80} />
        </label>

        <label className="field-label">
          <span>{text(locale, '게임 설명', 'Game description')}</span>
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} maxLength={400} />
        </label>

        <label className="field-label">
          <span>{text(locale, 'KKE-OH 리더보드 사용', 'Use KKE-OH leaderboard')}</span>
          <span className="toggle-row">
            <input type="checkbox" checked={leaderboardEnabled} onChange={(event) => setLeaderboardEnabled(event.target.checked)} />
            <span className="small-copy">{text(locale, '이 게임의 점수를 공용 리더보드로 보낼 수 있게 해요.', 'Allow this game to submit scores to the shared leaderboard.')}</span>
          </span>
        </label>

        <FileDropzone
          inputId="edit-thumbnail-upload"
          accept="image/png,image/jpeg,image/webp"
          label={text(locale, '썸네일 이미지', 'Thumbnail image')}
          hint={text(locale, '비워두면 지금 썸네일을 그대로 사용해요.', 'Leave it empty to keep the current thumbnail.')}
          file={thumbnailFile}
          onFileChange={setThumbnailFile}
          inputRef={thumbnailInputRef}
        />

        <div className="submit-main-mode-grid edit-mode-grid">
          {modeCards.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`submit-choice-card${mode === item.key ? ' is-active' : ''}`}
              onClick={() => {
                setMode(item.key);
                setError(null);
                setSuccess(null);
                setCompletedMode(null);
              }}
            >
              <strong>{item.title}</strong>
              <span>{item.hint}</span>
            </button>
          ))}
        </div>

        {mode === 'ai' ? (
          <div className="submit-section-stack">
            <label className="field-label">
              <span>{text(locale, 'AI에게 바꾸고 싶은 점', 'Tell AI what to change')}</span>
              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                rows={4}
                maxLength={1200}
                placeholder={text(locale, '예시: 장애물을 더 쉽게 하고 점수판을 더 크게 보여줘.', 'Example: Make the obstacles easier and add a bigger score board.')}
              />
            </label>

            <AiModelCompactPanel
              locale={locale}
              modelId={modelId}
              models={models}
              pointBalance={pointBalance}
              pointCost={aiPointCost}
              pending={pending}
              isShortage={aiPointShortage}
              onChange={setModelId}
              shortageCopy={text(locale, '포인트가 부족해요. 저장 버튼을 누르면 바로 충전할 수 있어요.', 'Not enough points. Press save to open the point shop.')}
            />

            {pending ? <AiProgressCard title={text(locale, 'AI가 게임을 고치는 중이에요', 'AI is updating your game')} detail={['Understanding your change request.', 'Analyzing the current game.', 'Generating updated rules and presentation.', 'Running final checks before saving.', 'Saving the updated result.']} step={aiProgressStep} dots={aiProgressDots} /> : null}
          </div>
        ) : null}

        {mode === 'html' ? (
          <FileDropzone
            inputId="edit-html-upload"
            accept=".html,.htm,text/html"
            label={text(locale, '새 HTML 파일', 'New HTML file')}
            hint={text(locale, '파일 없이 저장하면 제목, 설명, 썸네일만 바뀌어요.', 'If you save without a file, only the metadata will change.')}
            file={htmlFile}
            onFileChange={setHtmlFile}
            inputRef={htmlInputRef}
          />
        ) : null}

        {mode === 'zip' ? (
          <FileDropzone
            inputId="edit-zip-upload"
            accept=".zip,application/zip"
            label={text(locale, '새 ZIP 파일', 'New ZIP file')}
            hint={text(locale, '파일 없이 저장하면 제목, 설명, 썸네일만 바뀌어요.', 'If you save without a file, only the metadata will change.')}
            file={zipFile}
            onFileChange={setZipFile}
            inputRef={zipInputRef}
          />
        ) : null}

        <div className="button-row">
          <button type="button" className="button-primary button-fill" onClick={() => void submit()} disabled={pending}>
            {pending ? text(locale, '저장 중...', 'Saving...') : text(locale, '변경사항 저장', 'Save changes')}
          </button>
          <a href="/my-games" className="button-secondary">
            {text(locale, '취소', 'Cancel')}
          </a>
        </div>
      </div>

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

