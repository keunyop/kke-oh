'use client';
import { useMemo, useRef, useState } from 'react';
function getCopy(locale) {
    return locale === 'ko'
        ? {
            title: '게임 스튜디오',
            subtitle: '직접 만든 파일을 올리거나 프롬프트로 새 게임을 만들 수 있어요.',
            modePrompt: 'AI로 만들기',
            modeHtml: 'HTML 올리기',
            modeZip: 'ZIP 올리기',
            promptLabel: '게임 아이디어 프롬프트',
            promptPlaceholder: '예: 우주를 배경으로 한 1분짜리 피하기 게임을 만들어 줘. 모바일과 키보드 모두 지원해 줘.',
            promptHint: '프롬프트를 입력하면 KKE-OH 서버가 OpenAI를 사용해 HTML과 썸네일을 생성해 등록해요.',
            gameTitle: '게임 제목',
            gameDescription: '게임 설명',
            descriptionPlaceholder: '플레이어가 이 게임을 바로 이해할 수 있게 설명해 주세요.',
            htmlLabel: 'HTML 파일',
            htmlHintLabel: '실행 가능한 HTML 파일 한 개를 올려 주세요.',
            zipLabel: 'ZIP 파일',
            zipHintLabel: 'ZIP 안에 HTML 파일과 필요한 에셋이 함께 들어 있어야 해요.',
            thumbnail: '썸네일 이미지',
            thumbnailHint: '썸네일이 없으면 기본 플레이스홀더 이미지를 자동으로 사용해요.',
            inspect: 'ZIP 먼저 확인',
            inspecting: 'ZIP 확인 중...',
            publish: '게임 만들기',
            publishing: '등록 중...',
            generate: 'AI로 게임 만들기',
            generating: 'AI가 게임을 만드는 중...',
            uploadGuide: '이렇게 만들어요',
            guidePrompt1: 'AI로 만들기는 프롬프트만 입력하면 제목, 설명, HTML, 썸네일까지 자동 생성돼요.',
            guidePrompt2: 'HTML 올리기는 단일 HTML 파일과 선택 썸네일을 등록할 수 있어요.',
            guidePrompt3: 'ZIP 올리기는 ZIP 안의 썸네일을 사용하고, 없으면 기본 이미지를 넣어 줘요.',
            guidePrompt4: '파일은 클릭해서 고르거나 드래그 앤 드롭으로 올릴 수 있어요.',
            zipResult: 'ZIP 확인 결과',
            helper: '도움말',
            zipDone: 'ZIP 확인 완료',
            entry: '시작 파일',
            htmlCount: 'HTML 파일 수',
            thumbCount: '썸네일 후보 수',
            flagged: '외부 링크가 감지되어 추가 검토가 필요할 수 있어요.',
            safe: '현재까지 외부 링크 문제는 보이지 않아요.',
            zipHint: 'ZIP 먼저 확인을 누르면 시작 파일과 썸네일 후보를 미리 볼 수 있어요.',
            htmlHint: '썸네일을 따로 넣지 않으면 기본 이미지가 자동으로 등록돼요.',
            promptPanelHint: 'AI 생성에는 서버의 OPENAI_API_KEY 설정이 필요해요.',
            success: '게임이 등록되었어요!',
            open: '바로 열기',
            successFlagged: '등록은 완료됐고, 외부 링크는 추가 검토가 이뤄질 수 있어요.',
            errTitle: '게임 제목을 입력해 주세요.',
            errDesc: '게임 설명을 입력해 주세요.',
            errPrompt: '프롬프트를 8자 이상 입력해 주세요.',
            errHtml: 'HTML 파일을 선택해 주세요.',
            errZip: 'ZIP 파일을 선택해 주세요.',
            errInspect: 'ZIP 파일을 확인하지 못했어요.',
            errInspectFallback: 'ZIP 확인 중 문제가 생겼어요.',
            errPublish: '게임을 등록하지 못했어요.',
            errPublishFallback: '등록 중 문제가 생겼어요.',
            dropChoose: '파일 선택',
            dropOr: '또는 여기에 드롭',
            dropActive: '여기에 파일을 놓으세요',
            selectedFile: '선택된 파일',
            removeFile: '파일 제거',
            aiSectionTitle: 'AI 게임 만들기',
            manualSectionTitle: '파일로 게임 올리기'
        }
        : {
            title: 'Game Studio',
            subtitle: 'Upload your own files or ask AI to build a new game for you.',
            modePrompt: 'Create with AI',
            modeHtml: 'Upload HTML',
            modeZip: 'Upload ZIP',
            promptLabel: 'Game prompt',
            promptPlaceholder: 'Example: Make a one-minute dodge game in space with mobile and keyboard controls.',
            promptHint: 'KKE-OH uses OpenAI to generate the HTML and thumbnail, then publishes the game.',
            gameTitle: 'Game title',
            gameDescription: 'Game description',
            descriptionPlaceholder: 'Tell players what your game is about.',
            htmlLabel: 'HTML file',
            htmlHintLabel: 'Upload one playable HTML file.',
            zipLabel: 'ZIP file',
            zipHintLabel: 'The ZIP must include HTML and any assets the game needs.',
            thumbnail: 'Thumbnail image',
            thumbnailHint: 'If you skip the thumbnail, a default placeholder image is added automatically.',
            inspect: 'Check ZIP First',
            inspecting: 'Checking ZIP...',
            publish: 'Create Game',
            publishing: 'Publishing...',
            generate: 'Create with AI',
            generating: 'Generating game...',
            uploadGuide: 'How it works',
            guidePrompt1: 'AI mode turns your prompt into a title, description, HTML, and thumbnail.',
            guidePrompt2: 'HTML mode uploads one playable HTML file and an optional thumbnail.',
            guidePrompt3: 'ZIP mode uses the thumbnail inside the ZIP, and falls back to a default image if needed.',
            guidePrompt4: 'Every file field supports click-to-upload and drag and drop.',
            zipResult: 'ZIP check result',
            helper: 'Help',
            zipDone: 'ZIP check complete',
            entry: 'Entry file',
            htmlCount: 'HTML files',
            thumbCount: 'Thumbnail candidates',
            flagged: 'We found an external link and may review it again.',
            safe: 'No external link issue was found yet.',
            zipHint: 'Use Check ZIP First to preview the entry file and thumbnail candidates.',
            htmlHint: 'If you skip the thumbnail, a default image will be published automatically.',
            promptPanelHint: 'AI creation requires OPENAI_API_KEY on the server.',
            success: 'Your game is live!',
            open: 'Open',
            successFlagged: 'The game was published, and the external link may be reviewed later.',
            errTitle: 'Please enter a game title.',
            errDesc: 'Please enter a game description.',
            errPrompt: 'Please enter a prompt with at least 8 characters.',
            errHtml: 'Please choose an HTML file.',
            errZip: 'Please choose a ZIP file.',
            errInspect: 'Could not inspect the ZIP file.',
            errInspectFallback: 'Something went wrong while checking the ZIP file.',
            errPublish: 'Could not publish the game.',
            errPublishFallback: 'Something went wrong while publishing the game.',
            dropChoose: 'Choose file',
            dropOr: 'or drop it here',
            dropActive: 'Drop the file here',
            selectedFile: 'Selected file',
            removeFile: 'Remove file',
            aiSectionTitle: 'AI game creation',
            manualSectionTitle: 'Upload your own files'
        };
}
function FileDropzone({ inputId, accept, label, hint, file, onFileChange, copy, inputRef }) {
    const [isDragging, setIsDragging] = useState(false);
    function assignFileList(list) {
        onFileChange(list?.[0] ?? null);
    }
    function handleInputChange(event) {
        assignFileList(event.target.files);
    }
    function handleDrop(event) {
        event.preventDefault();
        setIsDragging(false);
        assignFileList(event.dataTransfer.files);
    }
    return (<div className="field-label">
      <span>{label}</span>
      <input ref={inputRef} id={inputId} type="file" accept={accept} onChange={handleInputChange} className="sr-only"/>
      <button type="button" className={`file-dropzone${isDragging ? ' is-dragging' : ''}`} onClick={() => inputRef.current?.click()} onDragEnter={(event) => {
            event.preventDefault();
            setIsDragging(true);
        }} onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
        }} onDragLeave={(event) => {
            event.preventDefault();
            const nextTarget = event.relatedTarget;
            if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) {
                setIsDragging(false);
            }
        }} onDrop={handleDrop}>
        <strong>{isDragging ? copy.dropActive : copy.dropChoose}</strong>
        <span>{copy.dropOr}</span>
      </button>
      {file ? (<div className="file-dropzone-meta">
          <span>
            {copy.selectedFile}: {file.name}
          </span>
          <button type="button" className="button-ghost file-dropzone-clear" onClick={() => {
                onFileChange(null);
                if (inputRef.current) {
                    inputRef.current.value = '';
                }
            }}>
            {copy.removeFile}
          </button>
        </div>) : null}
      {hint ? <span className="small-copy upload-input-hint">{hint}</span> : null}
    </div>);
}
export default function SubmitForm({ userLoginId, locale }) {
    const [mode, setMode] = useState('prompt');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [prompt, setPrompt] = useState('');
    const [htmlFile, setHtmlFile] = useState(null);
    const [zipFile, setZipFile] = useState(null);
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [inspectResult, setInspectResult] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [isInspecting, setIsInspecting] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const copy = useMemo(() => getCopy(locale), [locale]);
    const htmlInputRef = useRef(null);
    const zipInputRef = useRef(null);
    const thumbnailInputRef = useRef(null);
    function clearMessages() {
        setError(null);
        setSuccess(null);
    }
    function resetForm() {
        setTitle('');
        setDescription('');
        setPrompt('');
        setHtmlFile(null);
        setZipFile(null);
        setThumbnailFile(null);
        setInspectResult(null);
        if (htmlInputRef.current)
            htmlInputRef.current.value = '';
        if (zipInputRef.current)
            zipInputRef.current.value = '';
        if (thumbnailInputRef.current)
            thumbnailInputRef.current.value = '';
    }
    function validateManualForm() {
        if (!title.trim()) {
            setError(copy.errTitle);
            return false;
        }
        if (!description.trim()) {
            setError(copy.errDesc);
            return false;
        }
        if (mode === 'html' && !htmlFile) {
            setError(copy.errHtml);
            return false;
        }
        if (mode === 'zip' && !zipFile) {
            setError(copy.errZip);
            return false;
        }
        return true;
    }
    async function runZipInspection() {
        if (!validateManualForm() || !zipFile) {
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
            const data = (await response.json());
            if (!response.ok || !('inspectionId' in data)) {
                throw new Error(('error' in data ? data.error : undefined) ?? copy.errInspect);
            }
            setInspectResult(data);
            return data;
        }
        catch (cause) {
            setInspectResult(null);
            setError(cause instanceof Error ? cause.message : copy.errInspectFallback);
            return null;
        }
        finally {
            setIsInspecting(false);
        }
    }
    async function requestPublish(inspectionId) {
        const response = await fetch('/api/upload/confirm', {
            method: 'POST',
            headers: {
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                inspectionId,
                title,
                description
            })
        });
        const data = (await response.json());
        return { response, data };
    }
    async function publishManualGame() {
        if (!validateManualForm()) {
            return;
        }
        clearMessages();
        setIsPublishing(true);
        try {
            if (mode === 'html') {
                const formData = new FormData();
                formData.append('title', title);
                formData.append('description', description);
                if (htmlFile) {
                    formData.append('htmlFile', htmlFile);
                }
                if (thumbnailFile) {
                    formData.append('thumbnail', thumbnailFile);
                }
                const response = await fetch('/api/upload/paste', {
                    method: 'POST',
                    body: formData
                });
                const data = (await response.json());
                if (!response.ok || !('ok' in data)) {
                    throw new Error(('error' in data ? data.error : undefined) ?? copy.errPublish);
                }
                setSuccess(data);
                resetForm();
                return;
            }
            let inspection = inspectResult ?? (await runZipInspection());
            if (!inspection) {
                return;
            }
            let { response, data } = await requestPublish(inspection.inspectionId);
            if (response.status === 410) {
                inspection = await runZipInspection();
                if (!inspection) {
                    return;
                }
                ({ response, data } = await requestPublish(inspection.inspectionId));
            }
            if (!response.ok || !('ok' in data)) {
                throw new Error(('error' in data ? data.error : undefined) ?? copy.errPublish);
            }
            setSuccess(data);
            resetForm();
        }
        catch (cause) {
            setError(cause instanceof Error ? cause.message : copy.errPublishFallback);
        }
        finally {
            setIsPublishing(false);
        }
    }
    async function generateGame() {
        if (prompt.trim().length < 8) {
            setError(copy.errPrompt);
            return;
        }
        clearMessages();
        setIsPublishing(true);
        try {
            const response = await fetch('/api/upload/generate', {
                method: 'POST',
                headers: {
                    'content-type': 'application/json'
                },
                body: JSON.stringify({ prompt })
            });
            const data = (await response.json());
            if (!response.ok || !('ok' in data)) {
                throw new Error(('error' in data ? data.error : undefined) ?? copy.errPublish);
            }
            setSuccess(data);
            resetForm();
        }
        catch (cause) {
            setError(cause instanceof Error ? cause.message : copy.errPublishFallback);
        }
        finally {
            setIsPublishing(false);
        }
    }
    return (<div className="submit-layout">
      <div className="panel-card panel-card-form">
        <div className="panel-card-head">
          <span className="pill-label">{copy.title}</span>
          <h2>{userLoginId}</h2>
          <p>{copy.subtitle}</p>
        </div>

        <div className="tab-row auth-tabs submit-mode-tabs">
          <button type="button" className={`button-ghost auth-tab${mode === 'prompt' ? ' is-active' : ''}`} onClick={() => {
            setMode('prompt');
            setInspectResult(null);
            clearMessages();
        }}>
            {copy.modePrompt}
          </button>
          <button type="button" className={`button-ghost auth-tab${mode === 'html' ? ' is-active' : ''}`} onClick={() => {
            setMode('html');
            setInspectResult(null);
            clearMessages();
        }}>
            {copy.modeHtml}
          </button>
          <button type="button" className={`button-ghost auth-tab${mode === 'zip' ? ' is-active' : ''}`} onClick={() => {
            setMode('zip');
            setInspectResult(null);
            clearMessages();
        }}>
            {copy.modeZip}
          </button>
        </div>

        {mode === 'prompt' ? (<>
            <label className="field-label">
              {copy.promptLabel}
              <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} rows={6} maxLength={1200} placeholder={copy.promptPlaceholder}/>
              <span className="small-copy upload-input-hint">{copy.promptHint}</span>
            </label>
            <button type="button" className="button-primary button-fill" onClick={() => void generateGame()} disabled={isPublishing}>
              {isPublishing ? copy.generating : copy.generate}
            </button>
          </>) : (<>
            <label className="field-label">
              {copy.gameTitle}
              <input value={title} onChange={(event) => {
                setTitle(event.target.value);
                clearMessages();
            }} maxLength={80} required/>
            </label>

            <label className="field-label">
              {copy.gameDescription}
              <textarea value={description} onChange={(event) => {
                setDescription(event.target.value);
                clearMessages();
            }} rows={4} maxLength={400} placeholder={copy.descriptionPlaceholder} required/>
            </label>

            {mode === 'html' ? (<>
                <FileDropzone inputId="html-upload" accept=".html,.htm,text/html" label={copy.htmlLabel} hint={copy.htmlHintLabel} file={htmlFile} onFileChange={(file) => {
                    setHtmlFile(file);
                    clearMessages();
                }} copy={copy} inputRef={htmlInputRef}/>
                <FileDropzone inputId="thumbnail-upload" accept="image/png,image/jpeg,image/webp" label={copy.thumbnail} hint={copy.thumbnailHint} file={thumbnailFile} onFileChange={(file) => {
                    setThumbnailFile(file);
                    clearMessages();
                }} copy={copy} inputRef={thumbnailInputRef}/>
              </>) : (<FileDropzone inputId="zip-upload" accept=".zip,application/zip" label={copy.zipLabel} hint={copy.zipHintLabel} file={zipFile} onFileChange={(file) => {
                    setZipFile(file);
                    setInspectResult(null);
                    clearMessages();
                }} copy={copy} inputRef={zipInputRef}/>)}

            <div className="button-row">
              {mode === 'zip' ? (<button type="button" className="button-secondary button-fill" onClick={() => void runZipInspection()} disabled={isInspecting || isPublishing}>
                  {isInspecting ? copy.inspecting : copy.inspect}
                </button>) : null}
              <button type="button" className="button-primary button-fill" onClick={() => void publishManualGame()} disabled={isInspecting || isPublishing}>
                {isPublishing ? copy.publishing : copy.publish}
              </button>
            </div>
          </>)}

        {error ? <p className="error-text">{error}</p> : null}

        {success ? (<div className="status-card status-success">
            <p className="status-title">{copy.success}</p>
            <p className="small-copy">
              {copy.open}: <a href={success.gameUrl}>{success.gameUrl}</a>
            </p>
            {success.flagged ? <p className="small-copy">{copy.successFlagged}</p> : null}
          </div>) : null}
      </div>

      <div className="submit-side">
        <div className="panel-card">
          <h3>{copy.uploadGuide}</h3>
          <ul className="upload-rules">
            <li>{copy.guidePrompt1}</li>
            <li>{copy.guidePrompt2}</li>
            <li>{copy.guidePrompt3}</li>
            <li>{copy.guidePrompt4}</li>
          </ul>
        </div>

        <div className="panel-card">
          <h3>
            {mode === 'prompt' ? copy.aiSectionTitle : mode === 'zip' ? copy.zipResult : copy.manualSectionTitle}
          </h3>
          {mode === 'prompt' ? (<p className="small-copy">{copy.promptPanelHint}</p>) : mode === 'zip' && inspectResult ? (<div className="status-card">
              <p className="status-title">{copy.zipDone}</p>
              <p className="small-copy">
                {copy.entry}: {inspectResult.entryPath}
              </p>
              <p className="small-copy">
                {copy.htmlCount}: {inspectResult.htmlFiles.length}
              </p>
              <p className="small-copy">
                {copy.thumbCount}: {inspectResult.thumbnailCandidates.length}
              </p>
              <p className="small-copy">
                {inspectResult.thumbnailCandidates.length === 0 ? copy.thumbnailHint : inspectResult.allowlistViolation ? copy.flagged : copy.safe}
              </p>
            </div>) : (<p className="small-copy">{mode === 'zip' ? copy.zipHint : copy.htmlHint}</p>)}
        </div>
      </div>
    </div>);
}
