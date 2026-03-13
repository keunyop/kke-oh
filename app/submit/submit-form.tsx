'use client';

import { useEffect, useRef, useState, type ChangeEvent, type DragEvent, type RefObject } from 'react';
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
};

type TitleCheckResponse = {
  gameId?: string;
  available?: boolean;
  error?: string;
};

type ErrorResponse = {
  error?: string;
};

function getCopy(locale: Locale) {
  return locale === 'ko'
    ? {
        aiTitle: 'AI로 만들기',
        aiSubtitle: '아이디어를 쓰면 AI가 게임을 만들어줘요.',
        manualTitle: '직접 파일 올리기',
        manualSubtitle: '내가 만든 파일이 있으면 바로 올리면 돼요.',
        htmlMode: 'Upload HTML',
        zipMode: 'Upload ZIP',
        gameName: '게임 이름',
        gameNamePlaceholder: '예: 우주 피하기',
        gameNameHint: '게임 링크도 이 이름으로 만들어져요.',
        checkingName: '이름 확인 중...',
        nameAvailable: '좋아요! 이 이름을 쓸 수 있어요.',
        nameTaken: '이미 쓰는 이름이에요. 다른 이름으로 바꿔주세요.',
        namePreview: '게임 주소',
        promptLabel: '게임 아이디어',
        promptPlaceholder: '예: 별을 피하고 점수를 모으는 쉬운 우주 게임을 만들어줘.',
        aiDescription: '게임 설명',
        aiDescriptionHint: '비워두면 AI가 만들어줘요.',
        aiDescriptionPlaceholder: '예: 별을 피하고 점수를 모으는 게임',
        thumbnail: '썸네일 그림',
        thumbnailHint: '비워두면 AI가 만들어줘요.',
        htmlFile: 'HTML 파일',
        htmlHint: '게임이 바로 시작되는 HTML 파일 1개를 올려주세요.',
        zipFile: 'ZIP 파일',
        zipHint: 'HTML과 그림, 소리 파일을 함께 넣은 ZIP을 올려주세요.',
        manualDescription: '게임 설명',
        manualDescriptionPlaceholder: '친구들이 게임을 쉽게 알 수 있게 짧게 써주세요.',
        createWithAi: 'AI로 게임 만들기',
        createGame: 'Create Game',
        creating: '만드는 중...',
        checkingZip: 'ZIP 확인 중...',
        zipReady: 'ZIP 확인 완료',
        zipEntry: '시작 파일',
        zipHtmlCount: 'HTML 파일 수',
        zipThumbCount: '썸네일 후보 수',
        zipFlagged: '바깥 링크가 보여서 한 번 더 확인될 수 있어요.',
        zipSafe: '바깥 링크 문제는 보이지 않았어요.',
        success: '게임이 준비됐어요!',
        open: '바로 열기',
        createAnother: '다른 게임 만들기',
        errGameName: '게임 이름을 입력해주세요.',
        errPrompt: '게임 아이디어를 8글자 이상 써주세요.',
        errDescription: '게임 설명을 입력해주세요.',
        errHtml: 'HTML 파일을 골라주세요.',
        errZip: 'ZIP 파일을 골라주세요.',
        errTitleTaken: '이미 쓰는 이름이에요. 다른 이름으로 바꿔주세요.',
        dropChoose: '파일 고르기',
        dropOr: '또는 여기로 끌어오세요',
        dropActive: '여기에 놓아주세요',
        selectedFile: '선택한 파일',
        removeFile: '파일 빼기'
      }
    : {
        aiTitle: 'AI Create',
        aiSubtitle: 'Type an idea and AI will bild the game for you',
        manualTitle: 'Upload My Files',
        manualSubtitle: 'If you already made the game, just upload it.',
        htmlMode: 'Upload HTML',
        zipMode: 'Upload ZIP',
        gameName: 'Game name',
        gameNamePlaceholder: 'Example: Space Dodge',
        gameNameHint: 'Your game link will use this name too.',
        checkingName: 'Checking name...',
        nameAvailable: 'Nice! You can use this game name.',
        nameTaken: 'That game name is already used. Please choose another one.',
        namePreview: 'Game URL',
        promptLabel: 'Game idea',
        promptPlaceholder: 'Example: Make an easy space game where players dodge stars and collect points.',
        aiDescription: 'Game description',
        aiDescriptionHint: 'Leave it empty if you want AI to make it for you.',
        aiDescriptionPlaceholder: 'Example: Dodge stars and collect points.',
        thumbnail: 'Thumbnail image',
        thumbnailHint: 'Leave it empty if you want AI to make it for you.',
        htmlFile: 'HTML file',
        htmlHint: 'Upload one HTML file that starts the game.',
        zipFile: 'ZIP file',
        zipHint: 'Upload one ZIP with HTML and any pictures or sounds inside.',
        manualDescription: 'Game description',
        manualDescriptionPlaceholder: 'Write a short description so kids know what the game is.',
        createWithAi: 'Create with AI',
        createGame: 'Create Game',
        creating: 'Creating...',
        checkingZip: 'Checking ZIP...',
        zipReady: 'ZIP is ready',
        zipEntry: 'Start file',
        zipHtmlCount: 'HTML files',
        zipThumbCount: 'Thumbnail choices',
        zipFlagged: 'We found an outside link and may check it again.',
        zipSafe: 'No outside link problem was found.',
        success: 'Your game is ready!',
        open: 'Open now',
        createAnother: 'Make another game',
        errGameName: 'Please enter a game name.',
        errPrompt: 'Please write at least 8 characters for the game idea.',
        errDescription: 'Please enter a game description.',
        errHtml: 'Please choose an HTML file.',
        errZip: 'Please choose a ZIP file.',
        errTitleTaken: 'That game name is already used. Please choose another one.',
        dropChoose: 'Choose file',
        dropOr: 'or drop it here',
        dropActive: 'Drop the file here',
        selectedFile: 'Selected file',
        removeFile: 'Remove file'
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
  chooseLabel,
  orLabel,
  activeLabel,
  selectedLabel,
  removeLabel
}: {
  inputId: string;
  accept: string;
  label: string;
  hint?: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
  inputRef: RefObject<HTMLInputElement>;
  chooseLabel: string;
  orLabel: string;
  activeLabel: string;
  selectedLabel: string;
  removeLabel: string;
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
        <strong>{isDragging ? activeLabel : chooseLabel}</strong>
        <span>{orLabel}</span>
      </button>
      {file ? (
        <div className="file-dropzone-meta">
          <span>
            {selectedLabel}: {file.name}
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
            {removeLabel}
          </button>
        </div>
      ) : null}
      {hint ? <span className="small-copy upload-input-hint">{hint}</span> : null}
    </label>
  );
}

export default function SubmitForm({ locale }: { locale: Locale }) {
  const copy = getCopy(locale);
  const [mode, setMode] = useState<CreationMode>('ai');
  const [manualMode, setManualMode] = useState<ManualMode>('html');
  const [aiTitle, setAiTitle] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiDescription, setAiDescription] = useState('');
  const [aiThumbnail, setAiThumbnail] = useState<File | null>(null);
  const [manualTitle, setManualTitle] = useState('');
  const [manualDescription, setManualDescription] = useState('');
  const [htmlFile, setHtmlFile] = useState<File | null>(null);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [manualThumbnail, setManualThumbnail] = useState<File | null>(null);
  const [inspectResult, setInspectResult] = useState<InspectResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<PublishResponse | null>(null);
  const [isInspecting, setIsInspecting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isCheckingTitle, setIsCheckingTitle] = useState(false);
  const [titleState, setTitleState] = useState<{ gameId: string; available: boolean | null; message: string | null }>({
    gameId: '',
    available: null,
    message: null
  });
  const htmlInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);
  const aiThumbnailInputRef = useRef<HTMLInputElement>(null);
  const manualThumbnailInputRef = useRef<HTMLInputElement>(null);

  const activeTitle = mode === 'ai' ? aiTitle : manualTitle;

  useEffect(() => {
    const trimmedTitle = activeTitle.trim();
    if (trimmedTitle.length < 2) {
      setTitleState({ gameId: '', available: null, message: null });
      setIsCheckingTitle(false);
      return;
    }

    const timer = window.setTimeout(async () => {
      setIsCheckingTitle(true);

      try {
        const response = await fetch(`/api/upload/title-check?title=${encodeURIComponent(trimmedTitle)}`, {
          method: 'GET',
          cache: 'no-store'
        });
        const data = (await response.json()) as TitleCheckResponse;

        if (!response.ok) {
          throw new Error(data.error ?? copy.errTitleTaken);
        }

        setTitleState({
          gameId: data.gameId ?? '',
          available: Boolean(data.available),
          message: data.available ? copy.nameAvailable : copy.nameTaken
        });
      } catch (cause) {
        setTitleState({
          gameId: '',
          available: false,
          message: cause instanceof Error ? cause.message : copy.errTitleTaken
        });
      } finally {
        setIsCheckingTitle(false);
      }
    }, 350);

    return () => {
      window.clearTimeout(timer);
    };
  }, [activeTitle, copy.errTitleTaken, copy.nameAvailable, copy.nameTaken]);

  function clearMessages() {
    setError(null);
    setSuccess(null);
  }

  function resetAiForm() {
    setAiTitle('');
    setAiPrompt('');
    setAiDescription('');
    setAiThumbnail(null);
    if (aiThumbnailInputRef.current) aiThumbnailInputRef.current.value = '';
  }

  function resetManualForm() {
    setManualTitle('');
    setManualDescription('');
    setHtmlFile(null);
    setZipFile(null);
    setManualThumbnail(null);
    setInspectResult(null);
    if (htmlInputRef.current) htmlInputRef.current.value = '';
    if (zipInputRef.current) zipInputRef.current.value = '';
    if (manualThumbnailInputRef.current) manualThumbnailInputRef.current.value = '';
  }

  function isCurrentTitleAvailable(title: string) {
    const trimmedTitle = title.trim();
    return trimmedTitle.length >= 2 && titleState.gameId.length > 0 && titleState.available === true;
  }

  function validateAiForm() {
    if (!aiTitle.trim()) {
      setError(copy.errGameName);
      return false;
    }
    if (!isCurrentTitleAvailable(aiTitle)) {
      setError(copy.errTitleTaken);
      return false;
    }
    if (aiPrompt.trim().length < 8) {
      setError(copy.errPrompt);
      return false;
    }
    return true;
  }

  function validateManualForm() {
    if (!manualTitle.trim()) {
      setError(copy.errGameName);
      return false;
    }
    if (!isCurrentTitleAvailable(manualTitle)) {
      setError(copy.errTitleTaken);
      return false;
    }
    if (!manualDescription.trim()) {
      setError(copy.errDescription);
      return false;
    }
    if (manualMode === 'html' && !htmlFile) {
      setError(copy.errHtml);
      return false;
    }
    if (manualMode === 'zip' && !zipFile) {
      setError(copy.errZip);
      return false;
    }
    return true;
  }

  async function runZipInspection() {
    if (!manualTitle.trim()) {
      setError(copy.errGameName);
      return null;
    }
    if (!isCurrentTitleAvailable(manualTitle)) {
      setError(copy.errTitleTaken);
      return null;
    }
    if (!zipFile) {
      setError(copy.errZip);
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
        throw new Error(('error' in data ? data.error : undefined) ?? copy.errZip);
      }

      setInspectResult(data);
      return data;
    } catch (cause) {
      setInspectResult(null);
      setError(cause instanceof Error ? cause.message : copy.errZip);
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
      formData.append('title', aiTitle.trim());
      formData.append('prompt', aiPrompt.trim());
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
        throw new Error(('error' in data ? data.error : undefined) ?? 'Could not create the game.');
      }

      setSuccess(data);
      resetAiForm();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not create the game.');
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
        formData.append('description', manualDescription.trim());
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
          throw new Error(('error' in data ? data.error : undefined) ?? 'Could not create the game.');
        }

        setSuccess(data);
        resetManualForm();
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
          description: manualDescription.trim()
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
            description: manualDescription.trim()
          })
        });
        data = (await response.json()) as PublishResponse | ErrorResponse;
      }

      if (!response.ok || !('ok' in data)) {
        throw new Error(('error' in data ? data.error : undefined) ?? 'Could not create the game.');
      }

      setSuccess(data);
      resetManualForm();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not create the game.');
    } finally {
      setIsPublishing(false);
    }
  }

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
          <strong>{copy.aiTitle}</strong>
          <span>{copy.aiSubtitle}</span>
        </button>
        <button
          type="button"
          className={`submit-choice-card${mode === 'manual' ? ' is-active' : ''}`}
          onClick={() => {
            setMode('manual');
            clearMessages();
          }}
        >
          <strong>{copy.manualTitle}</strong>
          <span>{copy.manualSubtitle}</span>
        </button>
      </div>

      {mode === 'ai' ? (
        <div className="submit-section-stack">
          <label className="field-label">
            <span>{copy.gameName}</span>
            <input
              value={aiTitle}
              onChange={(event) => {
                setAiTitle(event.target.value);
                clearMessages();
              }}
              maxLength={80}
              placeholder={copy.gameNamePlaceholder}
            />
          </label>

          <div className="submit-title-status">
            <span className="small-copy">{copy.gameNameHint}</span>
            {activeTitle.trim() ? (
              <span className={`small-copy${titleState.available === false ? ' error-text' : ''}`}>
                {isCheckingTitle ? copy.checkingName : titleState.message}
              </span>
            ) : null}
            {titleState.gameId ? (
              <span className="small-copy">
                {copy.namePreview}: `/game/${titleState.gameId}`
              </span>
            ) : null}
          </div>

          <label className="field-label">
            <span>{copy.promptLabel}</span>
            <textarea
              value={aiPrompt}
              onChange={(event) => {
                setAiPrompt(event.target.value);
                clearMessages();
              }}
              rows={5}
              maxLength={1200}
              placeholder={copy.promptPlaceholder}
            />
          </label>

          <label className="field-label">
            <span>{copy.aiDescription}</span>
            <textarea
              value={aiDescription}
              onChange={(event) => {
                setAiDescription(event.target.value);
                clearMessages();
              }}
              rows={3}
              maxLength={400}
              placeholder={copy.aiDescriptionPlaceholder}
            />
            <span className="small-copy upload-input-hint">{copy.aiDescriptionHint}</span>
          </label>

          <FileDropzone
            inputId="ai-thumbnail-upload"
            accept="image/png,image/jpeg,image/webp"
            label={copy.thumbnail}
            hint={copy.thumbnailHint}
            file={aiThumbnail}
            onFileChange={(file) => {
              setAiThumbnail(file);
              clearMessages();
            }}
            inputRef={aiThumbnailInputRef}
            chooseLabel={copy.dropChoose}
            orLabel={copy.dropOr}
            activeLabel={copy.dropActive}
            selectedLabel={copy.selectedFile}
            removeLabel={copy.removeFile}
          />

          <button
            type="button"
            className="button-primary button-fill"
            onClick={() => void publishAiGame()}
            disabled={isPublishing || isCheckingTitle}
          >
            {isPublishing ? copy.creating : copy.createWithAi}
          </button>
        </div>
      ) : (
        <div className="submit-section-stack">
          <label className="field-label">
            <span>{copy.gameName}</span>
            <input
              value={manualTitle}
              onChange={(event) => {
                setManualTitle(event.target.value);
                clearMessages();
              }}
              maxLength={80}
              placeholder={copy.gameNamePlaceholder}
            />
          </label>

          <div className="submit-title-status">
            <span className="small-copy">{copy.gameNameHint}</span>
            {activeTitle.trim() ? (
              <span className={`small-copy${titleState.available === false ? ' error-text' : ''}`}>
                {isCheckingTitle ? copy.checkingName : titleState.message}
              </span>
            ) : null}
            {titleState.gameId ? (
              <span className="small-copy">
                {copy.namePreview}: `/game/${titleState.gameId}`
              </span>
            ) : null}
          </div>

          <label className="field-label">
            <span>{copy.manualDescription}</span>
            <textarea
              value={manualDescription}
              onChange={(event) => {
                setManualDescription(event.target.value);
                clearMessages();
              }}
              rows={3}
              maxLength={400}
              placeholder={copy.manualDescriptionPlaceholder}
            />
          </label>

          <div className="submit-submode-row">
            <button
              type="button"
              className={`button-ghost submit-submode-button${manualMode === 'html' ? ' is-active' : ''}`}
              onClick={() => {
                setManualMode('html');
                setInspectResult(null);
                clearMessages();
              }}
            >
              {copy.htmlMode}
            </button>
            <button
              type="button"
              className={`button-ghost submit-submode-button${manualMode === 'zip' ? ' is-active' : ''}`}
              onClick={() => {
                setManualMode('zip');
                setInspectResult(null);
                clearMessages();
              }}
            >
              {copy.zipMode}
            </button>
          </div>

          {manualMode === 'html' ? (
            <FileDropzone
              inputId="html-upload"
              accept=".html,.htm,text/html"
              label={copy.htmlFile}
              hint={copy.htmlHint}
              file={htmlFile}
              onFileChange={(file) => {
                setHtmlFile(file);
                clearMessages();
              }}
              inputRef={htmlInputRef}
              chooseLabel={copy.dropChoose}
              orLabel={copy.dropOr}
              activeLabel={copy.dropActive}
              selectedLabel={copy.selectedFile}
              removeLabel={copy.removeFile}
            />
          ) : (
            <FileDropzone
              inputId="zip-upload"
              accept=".zip,application/zip"
              label={copy.zipFile}
              hint={copy.zipHint}
              file={zipFile}
              onFileChange={(file) => {
                setZipFile(file);
                setInspectResult(null);
                clearMessages();
              }}
              inputRef={zipInputRef}
              chooseLabel={copy.dropChoose}
              orLabel={copy.dropOr}
              activeLabel={copy.dropActive}
              selectedLabel={copy.selectedFile}
              removeLabel={copy.removeFile}
            />
          )}

          <FileDropzone
            inputId="manual-thumbnail-upload"
            accept="image/png,image/jpeg,image/webp"
            label={copy.thumbnail}
            hint={copy.thumbnailHint}
            file={manualThumbnail}
            onFileChange={(file) => {
              setManualThumbnail(file);
              clearMessages();
            }}
            inputRef={manualThumbnailInputRef}
            chooseLabel={copy.dropChoose}
            orLabel={copy.dropOr}
            activeLabel={copy.dropActive}
            selectedLabel={copy.selectedFile}
            removeLabel={copy.removeFile}
          />

          {manualMode === 'zip' && inspectResult ? (
            <div className="status-card">
              <p className="status-title">{copy.zipReady}</p>
              <p className="small-copy">
                {copy.zipEntry}: {inspectResult.entryPath}
              </p>
              <p className="small-copy">
                {copy.zipHtmlCount}: {inspectResult.htmlFiles.length}
              </p>
              <p className="small-copy">
                {copy.zipThumbCount}: {inspectResult.thumbnailCandidates.length}
              </p>
              <p className="small-copy">{inspectResult.allowlistViolation ? copy.zipFlagged : copy.zipSafe}</p>
            </div>
          ) : null}

          <button
            type="button"
            className="button-primary button-fill"
            onClick={() => void publishManualGame()}
            disabled={isPublishing || isCheckingTitle || isInspecting}
          >
            {isInspecting ? copy.checkingZip : isPublishing ? copy.creating : copy.createGame}
          </button>
        </div>
      )}

      {error ? <p className="error-text">{error}</p> : null}

      {success ? (
        <div className="status-card status-success">
          <p className="status-title">{copy.success}</p>
          <p className="small-copy">
            {copy.open}: <a href={success.gameUrl}>{success.gameUrl}</a>
          </p>
          <button
            type="button"
            className="button-secondary"
            onClick={() => {
              setSuccess(null);
              clearMessages();
            }}
          >
            {copy.createAnother}
          </button>
        </div>
      ) : null}
    </section>
  );
}