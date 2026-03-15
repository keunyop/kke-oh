'use client';

import { useEffect, useRef, useState, type ChangeEvent, type DragEvent, type RefObject } from 'react';
import { useRouter } from 'next/navigation';
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

type SlugCheckResponse = {
  slug?: string;
  available?: boolean;
  issue?: 'invalid' | 'taken' | null;
  error?: string;
};

type ErrorResponse = {
  error?: string;
};

type AiProgressCopy = {
  title: string;
  detail: string[];
};

const AI_PROGRESS_STEP_DELAYS = [8000, 26000, 52000, 78000] as const;

function suggestSlug(value: string) {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase()
    .trim()
    .replace(/[''’"]/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

function getCopy(locale: Locale) {
  return locale === 'ko'
    ? {
        aiTitle: 'AI로 만들기',
        aiSubtitle: '아이디어만 적으면 AI가 게임을 만들어줘요.',
        manualTitle: '직접 파일 올리기',
        manualSubtitle: '이미 만든 게임이 있다면 파일을 바로 올릴 수 있어요.',
        htmlMode: 'HTML 올리기',
        zipMode: 'ZIP 올리기',
        gameName: '화면에 보일 게임 이름',
        gameNamePlaceholder: '예시: 우주 피하기',
        gameNameHint: '플레이어가 보게 될 게임 이름이에요.',
        gameNameOptionalHint: '비워 두면 AI가 게임 이름까지 제안해줘요.',
        urlGameName: 'URL 게임 이름',
        urlGameNamePlaceholder: '예시: color-pop-mania',
        urlGameNameHint: '영문, 숫자, 하이픈(-)만 사용할 수 있어요.',
        urlGameNameOptionalHint: '비워 두면 AI가 URL 이름도 함께 만들어줘요.',
        checkingUrlName: 'URL 이름 확인 중...',
        urlNameAvailable: '좋아요. 이 URL 이름을 사용할 수 있어요.',
        urlNameTaken: '이미 사용 중인 URL 이름이에요. 다른 이름을 써주세요.',
        urlNameInvalid: 'URL 이름은 영문, 숫자, 하이픈(-)만 사용할 수 있어요.',
        urlPreview: '게임 주소',
        promptLabel: '게임 아이디어',
        promptPlaceholder: '예시: 별을 피하고 점수를 모으는 쉬운 우주 게임을 만들어줘.',
        aiDescription: '게임 설명',
        aiDescriptionHint: '비워 두면 AI가 설명도 만들어줘요.',
        aiDescriptionPlaceholder: '예시: 별을 피하고 점수를 모으는 게임',
        thumbnail: '썸네일 그림',
        thumbnailHint: '비워 두면 AI가 썸네일까지 만들어줘요.',
        htmlFile: 'HTML 파일',
        htmlHint: '게임이 바로 시작되는 HTML 파일 1개를 올려주세요.',
        zipFile: 'ZIP 파일',
        zipHint: 'HTML, 이미지, 소리 파일을 함께 담은 ZIP을 올려주세요.',
        manualDescription: '게임 설명',
        manualDescriptionPlaceholder: '아이들이 게임을 쉽게 이해할 수 있게 짧게 적어주세요.',
        createWithAi: 'AI로 게임 만들기',
        createGame: '게임 만들기',
        creating: '만드는 중...',
        checkingZip: 'ZIP 확인 중...',
        zipReady: 'ZIP 확인 완료',
        zipEntry: '시작 파일',
        zipHtmlCount: 'HTML 파일 수',
        zipThumbCount: '썸네일 후보 수',
        zipFlagged: '외부 링크가 보여서 한 번 더 확인이 필요할 수 있어요.',
        zipSafe: '외부 링크 문제는 보이지 않았어요.',
        success: '게임이 준비되었어요!',
        open: '바로 열기',
        createAnother: '다른 게임 만들기',
        errGameName: '화면에 보일 게임 이름을 입력해주세요.',
        errPrompt: '게임 아이디어를 8글자 이상 적어주세요.',
        errDescription: '게임 설명을 입력해주세요.',
        errHtml: 'HTML 파일을 선택해주세요.',
        errZip: 'ZIP 파일을 선택해주세요.',
        errUrlName: 'URL 게임 이름을 입력해주세요.',
        errUrlNameTaken: '이미 사용 중인 URL 이름이에요. 다른 이름을 써주세요.',
        errInvalidUrlName: 'URL 이름은 영문, 숫자, 하이픈(-)만 사용할 수 있어요.',
        dropChoose: '파일 고르기',
        dropOr: '또는 여기로 끌어다 놓기',
        dropActive: '여기에 놓아주세요',
        selectedFile: '선택한 파일',
        removeFile: '파일 비우기'
      }
    : {
        aiTitle: 'AI Create',
        aiSubtitle: 'Type an idea and AI will build the game for you.',
        manualTitle: 'Upload My Files',
        manualSubtitle: 'If you already made the game, just upload it.',
        htmlMode: 'Upload HTML',
        zipMode: 'Upload ZIP',
        gameName: 'Display game name',
        gameNamePlaceholder: 'Example: Space Dodge',
        gameNameHint: 'This is the name players will see.',
        gameNameOptionalHint: 'Leave this empty if you want AI to name the game for you.',
        urlGameName: 'URL game name',
        urlGameNamePlaceholder: 'Example: color-pop-mania',
        urlGameNameHint: 'Use only English letters, numbers, and hyphens.',
        urlGameNameOptionalHint: 'Leave this empty if you want AI to generate the URL name too.',
        checkingUrlName: 'Checking URL name...',
        urlNameAvailable: 'Nice! You can use this URL name.',
        urlNameTaken: 'That URL game name is already used. Please choose another one.',
        urlNameInvalid: 'URL game names can use only English letters, numbers, and hyphens.',
        urlPreview: 'Game URL',
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
        errGameName: 'Please enter the display game name.',
        errPrompt: 'Please write at least 8 characters for the game idea.',
        errDescription: 'Please enter a game description.',
        errHtml: 'Please choose an HTML file.',
        errZip: 'Please choose a ZIP file.',
        errUrlName: 'Please enter the URL game name.',
        errUrlNameTaken: 'That URL game name is already used. Please choose another one.',
        errInvalidUrlName: 'URL game names can use only English letters, numbers, and hyphens.',
        dropChoose: 'Choose file',
        dropOr: 'or drop it here',
        dropActive: 'Drop the file here',
        selectedFile: 'Selected file',
        removeFile: 'Remove file'
      };
}

function getAiProgressCopy(locale: Locale): AiProgressCopy {
  return locale === 'ko'
    ? {
        title: 'AI가 게임을 만들고 있어요',
        detail: [
          '아이디어를 게임 기획으로 정리하고 있어요.',
          '규칙과 조작감, 점수 흐름을 설계하고 있어요.',
          '게임 코드와 인터랙션을 만들고 있어요.',
          '썸네일과 연출을 다듬고 있어요.',
          '최종 점검과 저장을 마무리하고 있어요.'
        ]
      }
    : {
        title: 'AI is building your game',
        detail: [
          'Turning your idea into a game plan.',
          'Designing the gameplay, HUD, and score flow.',
          'Generating the game code and interactions.',
          'Creating the thumbnail and final polish.',
          'Running final checks and saving everything.'
        ]
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
  const router = useRouter();
  const copy = getCopy(locale);
  const aiProgressCopy = getAiProgressCopy(locale);
  const [mode, setMode] = useState<CreationMode>('ai');
  const [manualMode, setManualMode] = useState<ManualMode>('html');
  const [aiTitle, setAiTitle] = useState('');
  const [aiSlug, setAiSlug] = useState('');
  const [aiSlugEdited, setAiSlugEdited] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiDescription, setAiDescription] = useState('');
  const [aiThumbnail, setAiThumbnail] = useState<File | null>(null);
  const [manualTitle, setManualTitle] = useState('');
  const [manualSlug, setManualSlug] = useState('');
  const [manualSlugEdited, setManualSlugEdited] = useState(false);
  const [manualDescription, setManualDescription] = useState('');
  const [htmlFile, setHtmlFile] = useState<File | null>(null);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [manualThumbnail, setManualThumbnail] = useState<File | null>(null);
  const [inspectResult, setInspectResult] = useState<InspectResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<PublishResponse | null>(null);
  const [isInspecting, setIsInspecting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [aiProgressStep, setAiProgressStep] = useState(0);
  const [aiProgressDots, setAiProgressDots] = useState(1);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [slugState, setSlugState] = useState<{
    checkedValue: string;
    slug: string;
    available: boolean | null;
    issue: 'invalid' | 'taken' | null;
    message: string | null;
  }>({
    checkedValue: '',
    slug: '',
    available: null,
    issue: null,
    message: null
  });
  const htmlInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);
  const aiThumbnailInputRef = useRef<HTMLInputElement>(null);
  const manualThumbnailInputRef = useRef<HTMLInputElement>(null);

  const activeSlug = mode === 'ai' ? aiSlug : manualSlug;
  const isAiPublishing = mode === 'ai' && isPublishing;

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
      for (const timer of timers) {
        window.clearTimeout(timer);
      }
      window.clearInterval(dotsTimer);
    };
  }, [isAiPublishing]);

  function getCreatedGameManageUrl() {
    return '/my-games';
  }

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
          throw new Error(data.error ?? copy.errInvalidUrlName);
        }

        const issue = data.available ? null : (data.issue ?? (data.slug ? 'taken' : 'invalid'));
        setSlugState({
          checkedValue: trimmedSlug,
          slug: data.slug ?? '',
          available: Boolean(data.available),
          issue,
          message: data.available ? copy.urlNameAvailable : issue === 'taken' ? copy.urlNameTaken : copy.urlNameInvalid
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
          message: cause instanceof Error ? cause.message : copy.errInvalidUrlName
        });
      } finally {
        setIsCheckingSlug(false);
      }
    }, 350);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [activeSlug, copy.errInvalidUrlName, copy.urlNameAvailable, copy.urlNameInvalid, copy.urlNameTaken]);

  function clearMessages() {
    setError(null);
    setSuccess(null);
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

  function resetAiForm() {
    setAiTitle('');
    setAiSlug('');
    setAiSlugEdited(false);
    setAiPrompt('');
    setAiDescription('');
    setAiThumbnail(null);
    if (aiThumbnailInputRef.current) aiThumbnailInputRef.current.value = '';
  }

  function resetManualForm() {
    setManualTitle('');
    setManualSlug('');
    setManualSlugEdited(false);
    setManualDescription('');
    setHtmlFile(null);
    setZipFile(null);
    setManualThumbnail(null);
    setInspectResult(null);
    if (htmlInputRef.current) htmlInputRef.current.value = '';
    if (zipInputRef.current) zipInputRef.current.value = '';
    if (manualThumbnailInputRef.current) manualThumbnailInputRef.current.value = '';
  }

  function getDisplayTitleError(title: string, options: { required: boolean }) {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      return options.required ? copy.errGameName : null;
    }

    if (trimmedTitle.length < 2 || trimmedTitle.length > 80) {
      return copy.errGameName;
    }

    return null;
  }

  function isCurrentSlugAvailable(slug: string) {
    const trimmedSlug = slug.trim();
    return trimmedSlug.length > 0 && trimmedSlug === slugState.checkedValue && slugState.available === true;
  }

  function getSlugError(slug: string, options: { required: boolean }) {
    const trimmedSlug = slug.trim();
    if (!trimmedSlug) {
      return options.required ? copy.errUrlName : null;
    }

    if (!isCurrentSlugAvailable(trimmedSlug)) {
      return slugState.issue === 'taken' ? copy.errUrlNameTaken : copy.errInvalidUrlName;
    }

    return null;
  }

  function validateAiForm() {
    const titleError = getDisplayTitleError(aiTitle, { required: false });
    if (titleError) {
      setError(titleError);
      return false;
    }

    const slugError = getSlugError(aiSlug, { required: Boolean(aiTitle.trim()) });
    if (slugError) {
      setError(slugError);
      return false;
    }

    if (aiPrompt.trim().length < 8) {
      setError(copy.errPrompt);
      return false;
    }

    return true;
  }

  function validateManualForm() {
    const titleError = getDisplayTitleError(manualTitle, { required: true });
    if (titleError) {
      setError(titleError);
      return false;
    }

    const slugError = getSlugError(manualSlug, { required: true });
    if (slugError) {
      setError(slugError);
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
    const titleError = getDisplayTitleError(manualTitle, { required: true });
    if (titleError) {
      setError(titleError);
      return null;
    }

    const slugError = getSlugError(manualSlug, { required: true });
    if (slugError) {
      setError(slugError);
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
      if (aiTitle.trim()) {
        formData.append('title', aiTitle.trim());
      }
      if (aiSlug.trim()) {
        formData.append('slug', aiSlug.trim());
      }
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

      resetAiForm();
      router.push(getCreatedGameManageUrl());
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
        formData.append('slug', manualSlug.trim());
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

        resetManualForm();
        router.push(getCreatedGameManageUrl());
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
            slug: manualSlug.trim(),
            description: manualDescription.trim()
          })
        });
        data = (await response.json()) as PublishResponse | ErrorResponse;
      }

      if (!response.ok || !('ok' in data)) {
        throw new Error(('error' in data ? data.error : undefined) ?? 'Could not create the game.');
      }

      resetManualForm();
      router.push(getCreatedGameManageUrl());
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
            <span>{copy.gameName}</span>
            <input
              value={aiTitle}
              onChange={(event) => handleAiTitleChange(event.target.value)}
              maxLength={80}
              placeholder={copy.gameNamePlaceholder}
            />
            <span className="small-copy upload-input-hint">{copy.gameNameOptionalHint}</span>
          </label>

          <label className="field-label">
            <span>{copy.urlGameName}</span>
            <input
              value={aiSlug}
              onChange={(event) => handleAiSlugChange(event.target.value)}
              maxLength={80}
              placeholder={copy.urlGameNamePlaceholder}
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
            />
          </label>

          <div className="submit-title-status">
            <span className="small-copy">{copy.urlGameNameOptionalHint}</span>
            <span className="small-copy">{copy.urlGameNameHint}</span>
            {activeSlug.trim() ? (
              <span className={`small-copy${slugState.issue || slugState.available === false ? ' error-text' : ''}`}>
                {isCheckingSlug ? copy.checkingUrlName : slugState.message}
              </span>
            ) : null}
            {slugState.slug ? (
              <span className="small-copy">
                {copy.urlPreview}: `/game/${slugState.slug}`
              </span>
            ) : null}
          </div>

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

          {isAiPublishing ? (
            <div className="status-card submit-progress-card" role="status" aria-live="polite">
              <p className="status-title">
                {aiProgressCopy.title}
                <span className="submit-progress-dots" aria-hidden="true">
                  {'.'.repeat(aiProgressDots)}
                </span>
              </p>
              <p className="small-copy">
                {aiProgressCopy.detail[Math.min(aiProgressStep, aiProgressCopy.detail.length - 1)]}
                <span className="submit-progress-dots" aria-hidden="true">
                  {'.'.repeat(aiProgressDots)}
                </span>
              </p>
              <div className="submit-progress-steps" aria-hidden="true">
                {aiProgressCopy.detail.map((label, index) => (
                  <span
                    key={label}
                    className={`submit-progress-step${
                      index < aiProgressStep ? ' is-complete' : index === aiProgressStep ? ' is-active' : ''
                    }`}
                  />
                ))}
              </div>
            </div>
          ) : null}

          <button
            type="button"
            className="button-primary button-fill"
            onClick={() => void publishAiGame()}
            disabled={isPublishing || isCheckingSlug}
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
              onChange={(event) => handleManualTitleChange(event.target.value)}
              maxLength={80}
              placeholder={copy.gameNamePlaceholder}
            />
            <span className="small-copy upload-input-hint">{copy.gameNameHint}</span>
          </label>

          <label className="field-label">
            <span>{copy.urlGameName}</span>
            <input
              value={manualSlug}
              onChange={(event) => handleManualSlugChange(event.target.value)}
              maxLength={80}
              placeholder={copy.urlGameNamePlaceholder}
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
            />
          </label>

          <div className="submit-title-status">
            <span className="small-copy">{copy.urlGameNameHint}</span>
            {activeSlug.trim() ? (
              <span className={`small-copy${slugState.issue || slugState.available === false ? ' error-text' : ''}`}>
                {isCheckingSlug ? copy.checkingUrlName : slugState.message}
              </span>
            ) : null}
            {slugState.slug ? (
              <span className="small-copy">
                {copy.urlPreview}: `/game/${slugState.slug}`
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
            disabled={isPublishing || isCheckingSlug || isInspecting}
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
            {locale === 'ko'
              ? '吏湲덉? 珥덉븞?쇰줈 ??λ릺?덉뼱?? ??寃뚯엫?먯꽌 ?뚯뒪?명븳 ??寃뚯떆?????덉뼱??'
              : 'This was saved as a private draft. Test it in My Games, then publish it when you are ready.'}
          </p>
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



