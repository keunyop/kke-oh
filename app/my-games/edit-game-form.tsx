'use client';

import { useRef, useState, type ChangeEvent, type DragEvent, type RefObject } from 'react';
import Image from 'next/image';
import { getGameAssetUrl } from '@/lib/games/urls';
import { getPlaceholderThumbnailDataUrl } from '@/lib/games/placeholder';
import type { GameRecord } from '@/lib/games/types';
import type { Locale } from '@/lib/i18n';

type EditMode = 'details' | 'html' | 'zip' | 'ai';

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

function getCopy(locale: Locale) {
  return locale === 'ko'
    ? {
        title: '수정 방법',
        details: '정보만 바꾸기',
        html: 'HTML로 바꾸기',
        zip: 'ZIP으로 바꾸기',
        ai: 'AI로 다시 만들기',
        detailsHint: '제목, 설명, 썸네일만 바꿔요.',
        htmlHint: '새 HTML 파일로 게임을 바꿔요.',
        zipHint: '새 ZIP 파일로 게임 전체를 바꿔요.',
        aiHint: 'AI에게 바꿀 내용을 말해줘요.',
        gameName: '게임 이름',
        description: '게임 설명',
        thumbnail: '썸네일',
        thumbnailHint: '새 그림을 올리지 않으면 지금 썸네일을 그대로 써요.',
        prompt: 'AI에게 부탁할 내용',
        promptPlaceholder: '예: 장애물을 더 쉽게 만들고 점수판을 크게 보여줘.',
        htmlFile: '새 HTML 파일',
        zipFile: '새 ZIP 파일',
        currentGame: '지금 게임',
        currentLink: '현재 링크',
        save: '저장하기',
        saving: '저장 중...',
        open: '게임 열기',
        back: '내 게임으로',
        success: '게임이 수정됐어요!',
        choose: '파일 고르기',
        orDrop: '또는 여기로 끌어오세요',
        drop: '여기에 놓아주세요',
        selected: '선택한 파일',
        remove: '파일 빼기'
      }
    : {
        title: 'Edit options',
        details: 'Update details',
        html: 'Replace with HTML',
        zip: 'Replace with ZIP',
        ai: 'Remake with AI',
        detailsHint: 'Change the title, description, or thumbnail only.',
        htmlHint: 'Replace the game with a new HTML file.',
        zipHint: 'Replace the whole game with a new ZIP file.',
        aiHint: 'Tell AI what to change.',
        gameName: 'Game name',
        description: 'Game description',
        thumbnail: 'Thumbnail',
        thumbnailHint: 'If you skip this, the current thumbnail stays the same.',
        prompt: 'What should AI change?',
        promptPlaceholder: 'Example: Make the obstacles easier and add a big score board.',
        htmlFile: 'New HTML file',
        zipFile: 'New ZIP file',
        currentGame: 'Current game',
        currentLink: 'Current link',
        save: 'Save changes',
        saving: 'Saving...',
        open: 'Open game',
        back: 'Back to My Games',
        success: 'Your game was updated!',
        choose: 'Choose file',
        orDrop: 'or drop it here',
        drop: 'Drop the file here',
        selected: 'Selected file',
        remove: 'Remove file'
      };
}

function FileDropzone({
  inputId,
  accept,
  label,
  hint,
  file,
  onFileChange,
  inputRef,
  copy
}: {
  inputId: string;
  accept: string;
  label: string;
  hint?: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
  inputRef: RefObject<HTMLInputElement>;
  copy: ReturnType<typeof getCopy>;
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
        <strong>{isDragging ? copy.drop : copy.choose}</strong>
        <span>{copy.orDrop}</span>
      </button>
      {file ? (
        <div className="file-dropzone-meta">
          <span>
            {copy.selected}: {file.name}
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
            {copy.remove}
          </button>
        </div>
      ) : null}
      {hint ? <span className="small-copy upload-input-hint">{hint}</span> : null}
    </label>
  );
}

export function EditGameForm({ game, locale }: Props) {
  const copy = getCopy(locale);
  const [mode, setMode] = useState<EditMode>('details');
  const [title, setTitle] = useState(game.title);
  const [description, setDescription] = useState(game.description);
  const [prompt, setPrompt] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [htmlFile, setHtmlFile] = useState<File | null>(null);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [gameUrl, setGameUrl] = useState(`/game/${game.id}`);
  const [currentGame, setCurrentGame] = useState(game);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const htmlInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  const currentImageUrl = currentGame.thumbnail_path
    ? getGameAssetUrl(currentGame.id, currentGame.thumbnail_path)
    : getPlaceholderThumbnailDataUrl(currentGame.title);

  async function submit() {
    setPending(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('mode', mode);
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      if (prompt.trim()) formData.append('prompt', prompt.trim());
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
      setGameUrl(data.gameUrl ?? `/game/${data.game.id}`);
      setThumbnailFile(null);
      setHtmlFile(null);
      setZipFile(null);
      setPrompt('');
      if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
      if (htmlInputRef.current) htmlInputRef.current.value = '';
      if (zipInputRef.current) zipInputRef.current.value = '';
      setSuccess(copy.success);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update the game.');
    } finally {
      setPending(false);
    }
  }

  const modeCards: Array<{ key: EditMode; title: string; hint: string }> = [
    { key: 'details', title: copy.details, hint: copy.detailsHint },
    { key: 'html', title: copy.html, hint: copy.htmlHint },
    { key: 'zip', title: copy.zip, hint: copy.zipHint },
    { key: 'ai', title: copy.ai, hint: copy.aiHint }
  ];

  return (
    <section className="panel-card panel-card-form submit-panel-simple">
      <div className="edit-game-preview">
        <div className="edit-game-preview-media">
          <Image src={currentImageUrl} alt={currentGame.title} fill className="game-card-image" unoptimized />
        </div>
        <div className="edit-game-preview-copy">
          <p className="small-copy">{copy.currentGame}</p>
          <h2>{currentGame.title}</h2>
          <p>{currentGame.description}</p>
          <p className="small-copy">
            {copy.currentLink}: {gameUrl}
          </p>
        </div>
      </div>

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
            }}
          >
            <strong>{item.title}</strong>
            <span>{item.hint}</span>
          </button>
        ))}
      </div>

      <div className="submit-section-stack">
        <label className="field-label">
          <span>{copy.gameName}</span>
          <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={80} />
        </label>

        <label className="field-label">
          <span>{copy.description}</span>
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} maxLength={400} />
        </label>

        <FileDropzone
          inputId="edit-thumbnail-upload"
          accept="image/png,image/jpeg,image/webp"
          label={copy.thumbnail}
          hint={copy.thumbnailHint}
          file={thumbnailFile}
          onFileChange={setThumbnailFile}
          inputRef={thumbnailInputRef}
          copy={copy}
        />

        {mode === 'html' ? (
          <FileDropzone
            inputId="edit-html-upload"
            accept=".html,.htm,text/html"
            label={copy.htmlFile}
            file={htmlFile}
            onFileChange={setHtmlFile}
            inputRef={htmlInputRef}
            copy={copy}
          />
        ) : null}

        {mode === 'zip' ? (
          <FileDropzone
            inputId="edit-zip-upload"
            accept=".zip,application/zip"
            label={copy.zipFile}
            file={zipFile}
            onFileChange={setZipFile}
            inputRef={zipInputRef}
            copy={copy}
          />
        ) : null}

        {mode === 'ai' ? (
          <label className="field-label">
            <span>{copy.prompt}</span>
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              rows={4}
              maxLength={1200}
              placeholder={copy.promptPlaceholder}
            />
          </label>
        ) : null}

        <div className="button-row">
          <button type="button" className="button-primary button-fill" onClick={() => void submit()} disabled={pending}>
            {pending ? copy.saving : copy.save}
          </button>
          <a href={gameUrl} className="button-secondary">
            {copy.open}
          </a>
          <a href="/my-games" className="button-secondary">
            {copy.back}
          </a>
        </div>
      </div>

      {error ? <p className="error-text">{error}</p> : null}
      {success ? <p className="admin-notice">{success}</p> : null}
    </section>
  );
}
