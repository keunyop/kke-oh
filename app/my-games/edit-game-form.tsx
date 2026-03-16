'use client';

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent, type RefObject } from 'react';
import Image from 'next/image';
import { AiProgressCard } from '@/components/ai/ai-progress-card';
import { getGameAssetUrl } from '@/lib/games/urls';
import { getPlaceholderThumbnailDataUrl } from '@/lib/games/placeholder';
import type { GameRecord } from '@/lib/games/types';
import type { Locale } from '@/lib/i18n';

type EditMode = 'html' | 'zip' | 'ai';

type Props = {
  game: GameRecord;
  locale: Locale;
};

type ApiResponse = {
  ok?: boolean;
  error?: string;
  game?: GameRecord | null;
  gameUrl?: string;
};

type AiModel = {
  id: string;
  label: string;
  modelName: string;
  pointCostEdit: number;
};

type AiModelsResponse = {
  models?: AiModel[];
  balance?: number;
  error?: string;
};

const AI_PROGRESS_STEP_DELAYS = [7000, 20000, 42000, 64000] as const;

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
        <strong>{locale === 'ko' ? (isDragging ? '여기에 놓아주세요' : '파일 고르기') : isDragging ? 'Drop the file here' : 'Choose file'}</strong>
        <span>{locale === 'ko' ? '또는 여기로 끌어다 놓기' : 'or drop it here'}</span>
      </button>
      {file ? (
        <div className="file-dropzone-meta">
          <span>
            {locale === 'ko' ? '선택한 파일' : 'Selected file'}: {file.name}
          </span>
          <button type="button" className="button-ghost file-dropzone-clear" onClick={() => { onFileChange(null); if (inputRef.current) inputRef.current.value = ''; }}>
            {locale === 'ko' ? '파일 비우기' : 'Remove file'}
          </button>
        </div>
      ) : null}
      {hint ? <span className="small-copy upload-input-hint">{hint}</span> : null}
    </label>
  );
}

export function EditGameForm({ game, locale }: Props) {
  const [mode, setMode] = useState<EditMode>('html');
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
  const [gameUrl, setGameUrl] = useState(`/game/${game.slug}`);
  const [currentGame, setCurrentGame] = useState(game);
  const [aiProgressStep, setAiProgressStep] = useState(0);
  const [aiProgressDots, setAiProgressDots] = useState(1);
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
        if (cancelled) return;
        setModels(data.models);
        setModelId(data.models[0]?.id ?? '');
        setPointBalance(data.balance ?? 0);
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'Could not load AI models.');
      }
    }
    void loadModels();
    return () => { cancelled = true; };
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
      }
    } catch {
      // Ignore balance refresh failures.
    }
  }

  async function submit() {
    setPending(true);
    setError(null);
    setSuccess(null);

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
      setSuccess(locale === 'ko' ? '게임이 수정되었어요.' : 'Your game was updated.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update the game.');
    } finally {
      setPending(false);
    }
  }

  const modeCards: Array<{ key: EditMode; title: string; hint: string }> = [
    { key: 'html', title: locale === 'ko' ? 'HTML로 수정' : 'Replace with HTML', hint: locale === 'ko' ? '새 HTML 파일로 게임을 바꿔요. 파일 없이 제목, 설명, 썸네일만 바꿔도 돼요.' : 'Replace the game with a new HTML file, or just update the metadata.' },
    { key: 'zip', title: locale === 'ko' ? 'ZIP으로 수정' : 'Replace with ZIP', hint: locale === 'ko' ? '새 ZIP 파일로 게임 전체를 바꿔요. 파일 없이 메타데이터만 수정해도 돼요.' : 'Replace the full game with a new ZIP, or just update the metadata.' },
    { key: 'ai', title: locale === 'ko' ? 'AI로 수정' : 'Edit with AI', hint: locale === 'ko' ? 'AI 모델을 고르고 수정 요청을 적어주세요.' : 'Choose an AI model and describe the changes you want.' }
  ];

  return (
    <section className="panel-card panel-card-form submit-panel-simple">
      <div className="edit-game-preview">
        <div className="edit-game-preview-media">
          <Image src={currentImageUrl} alt={currentGame.title} fill className="game-card-image" unoptimized />
        </div>
        <div className="edit-game-preview-copy">
          <p className="small-copy">{locale === 'ko' ? '현재 게임' : 'Current game'}</p>
          <h2>{currentGame.title}</h2>
          <p>{currentGame.description}</p>
          <p className="small-copy">{locale === 'ko' ? '현재 링크' : 'Current link'}: {gameUrl}</p>
        </div>
      </div>

      <div className="submit-main-mode-grid edit-mode-grid">
        {modeCards.map((item) => (
          <button key={item.key} type="button" className={`submit-choice-card${mode === item.key ? ' is-active' : ''}`} onClick={() => { setMode(item.key); setError(null); setSuccess(null); }}>
            <strong>{item.title}</strong>
            <span>{item.hint}</span>
          </button>
        ))}
      </div>

      <div className="submit-section-stack">
        <label className="field-label">
          <span>{locale === 'ko' ? '게임 이름' : 'Game name'}</span>
          <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={80} />
        </label>

        <label className="field-label">
          <span>{locale === 'ko' ? '게임 설명' : 'Game description'}</span>
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} maxLength={400} />
        </label>

        <label className="field-label">
          <span>{locale === 'ko' ? 'KKE-OH 리더보드 사용' : 'Use KKE-OH leaderboard'}</span>
          <span className="toggle-row"><input type="checkbox" checked={leaderboardEnabled} onChange={(event) => setLeaderboardEnabled(event.target.checked)} /><span className="small-copy">{locale === 'ko' ? '수동 업로드 게임도 점수를 저장할 수 있게 연결해요.' : 'Allow this game to submit scores to the shared leaderboard.'}</span></span>
        </label>

        <FileDropzone inputId="edit-thumbnail-upload" accept="image/png,image/jpeg,image/webp" label={locale === 'ko' ? '썸네일 이미지' : 'Thumbnail'} hint={locale === 'ko' ? '비워 두면 현재 썸네일을 유지해요.' : 'Leave it empty to keep the current thumbnail.'} file={thumbnailFile} onFileChange={setThumbnailFile} inputRef={thumbnailInputRef} locale={locale} />

        {mode === 'html' ? <FileDropzone inputId="edit-html-upload" accept=".html,.htm,text/html" label={locale === 'ko' ? '새 HTML 파일' : 'New HTML file'} hint={locale === 'ko' ? '파일 없이 저장하면 제목, 설명, 썸네일만 바뀌어요.' : 'If you save without a file, only the metadata will change.'} file={htmlFile} onFileChange={setHtmlFile} inputRef={htmlInputRef} locale={locale} /> : null}
        {mode === 'zip' ? <FileDropzone inputId="edit-zip-upload" accept=".zip,application/zip" label={locale === 'ko' ? '새 ZIP 파일' : 'New ZIP file'} hint={locale === 'ko' ? '파일 없이 저장하면 제목, 설명, 썸네일만 바뀌어요.' : 'If you save without a file, only the metadata will change.'} file={zipFile} onFileChange={setZipFile} inputRef={zipInputRef} locale={locale} /> : null}

        {mode === 'ai' ? (
          <>
            <div className="submit-inline-grid">
              <label className="field-label">
                <span>{locale === 'ko' ? 'AI 모델' : 'AI model'}</span>
                <select value={modelId} onChange={(event) => setModelId(event.target.value)} disabled={pending}>
                  {models.map((model) => <option key={model.id} value={model.id}>{model.label} · {model.modelName}</option>)}
                </select>
              </label>
              <div className="status-card submit-cost-card">
                <p className="small-copy">{locale === 'ko' ? '현재 포인트' : 'Current points'}</p>
                <strong>{pointBalance}</strong>
                <p className="small-copy">{locale === 'ko' ? '예상 차감' : 'Expected cost'}</p>
                <strong>{aiPointCost}</strong>
              </div>
            </div>
            <label className="field-label">
              <span>{locale === 'ko' ? 'AI에게 바꿀 내용을 알려주세요' : 'Tell AI what to change'}</span>
              <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} rows={4} maxLength={1200} placeholder={locale === 'ko' ? '예시: 장애물을 더 쉽게 하고 큰 점수판을 추가해줘.' : 'Example: Make the obstacles easier and add a bigger score board.'} />
            </label>
            {pending ? <AiProgressCard title={locale === 'ko' ? 'AI가 게임을 수정하고 있어요' : 'AI is updating your game'} detail={locale === 'ko' ? ['요청 내용을 정리하고 있어요.', '현재 게임을 분석하고 있어요.', '새 규칙과 연출을 만들고 있어요.', '저장 전에 최종 점검을 하고 있어요.', '수정 결과를 저장하고 있어요.'] : ['Understanding your change request.', 'Analyzing the current game.', 'Generating updated rules and presentation.', 'Running final checks before saving.', 'Saving the updated result.']} step={aiProgressStep} dots={aiProgressDots} /> : null}
            {aiPointShortage ? <p className="error-text">{locale === 'ko' ? '포인트가 부족해요. 포인트를 충전한 뒤 다시 시도해주세요.' : 'You do not have enough points. Please top up and try again.'}</p> : null}
          </>
        ) : null}

        <div className="button-row">
          <button type="button" className="button-primary button-fill" onClick={() => void submit()} disabled={pending || aiPointShortage}>{pending ? (locale === 'ko' ? '저장 중...' : 'Saving...') : (locale === 'ko' ? '변경 저장' : 'Save changes')}</button>
          <a href={gameUrl} className="button-secondary">{locale === 'ko' ? '게임 열기' : 'Open game'}</a>
          <a href="/my-games" className="button-secondary">{locale === 'ko' ? '내 게임으로' : 'Back to My Games'}</a>
        </div>
      </div>

      {error ? <p className="error-text">{error}</p> : null}
      {success ? <p className="admin-notice">{success}</p> : null}
    </section>
  );
}
