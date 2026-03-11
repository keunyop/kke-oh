'use client';

import { useMemo, useState } from 'react';
import type { Locale } from '@/lib/i18n';

type UploadMode = 'html' | 'zip';

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

type ErrorResponse = {
  error?: string;
};

function getCopy(locale: Locale) {
  return locale === 'ko'
    ? {
        title: '님의 새 게임',
        subtitle: '아래에서 올리기 쉬운 방식을 골라 주세요.',
        tabHtml: 'HTML 파일',
        tabZip: 'ZIP 파일',
        gameTitle: '게임 제목',
        gameDescription: '게임 설명',
        descriptionPlaceholder: '친구들이 어떤 게임인지 바로 알 수 있게 소개해 주세요.',
        html: 'HTML 파일',
        htmlHintLabel: '실행 가능한 HTML 파일 1개를 업로드합니다.',
        zip: 'ZIP 파일',
        thumbnail: '썸네일 이미지 (선택)',
        inspect: 'ZIP 먼저 확인',
        inspecting: 'ZIP 확인 중...',
        publish: '게임 올리기',
        publishing: '올리는 중...',
        uploadGuide: '업로드 안내',
        guide1: '게임 제목과 설명은 꼭 입력해 주세요.',
        guide2: 'HTML 탭에서는 단일 HTML 파일을 업로드합니다.',
        guide3: 'ZIP 탭에서는 HTML 파일이 포함된 ZIP을 업로드합니다.',
        guide4: '썸네일은 선택입니다.',
        zipResult: 'ZIP 확인 결과',
        helper: '도움말',
        zipDone: 'ZIP 확인 완료',
        entry: '시작 파일',
        htmlCount: 'HTML 파일 수',
        thumbCount: '썸네일 후보 수',
        flagged: '외부 링크가 보여서 한 번 더 검토할 수 있습니다.',
        safe: '현재까지 외부 링크 문제는 보이지 않습니다.',
        zipHint: 'ZIP 먼저 확인을 누르면 시작 파일과 썸네일 후보를 미리 볼 수 있습니다.',
        htmlHint: 'HTML 파일을 올린 뒤 바로 게임 올리기를 누르면 됩니다.',
        success: '게임이 공개되었습니다.',
        open: '바로 열기',
        successFlagged: '업로드는 완료되었습니다. 외부 링크는 추가 검토할 수 있습니다.',
        errTitle: '게임 제목을 입력해 주세요.',
        errDesc: '게임 설명을 입력해 주세요.',
        errHtml: 'HTML 파일을 선택해 주세요.',
        errZip: 'ZIP 파일을 선택해 주세요.',
        errInspect: 'ZIP 파일을 확인하지 못했습니다.',
        errInspectFallback: 'ZIP을 확인하는 중 문제가 생겼습니다.',
        errPublish: '게임을 올리지 못했습니다.',
        errPublishFallback: '게임을 올리는 중 문제가 생겼습니다.'
      }
    : {
        title: "'s new game",
        subtitle: 'Choose the upload style that feels easiest.',
        tabHtml: 'HTML file',
        tabZip: 'Upload ZIP',
        gameTitle: 'Game title',
        gameDescription: 'Game description',
        descriptionPlaceholder: 'Tell players what your game is about.',
        html: 'HTML file',
        htmlHintLabel: 'Upload one playable HTML file.',
        zip: 'ZIP file',
        thumbnail: 'Thumbnail image (optional)',
        inspect: 'Check ZIP First',
        inspecting: 'Checking ZIP...',
        publish: 'Upload Game',
        publishing: 'Uploading...',
        uploadGuide: 'Easy upload guide',
        guide1: 'Game title and description are required.',
        guide2: 'The HTML tab uploads a single HTML file.',
        guide3: 'The ZIP tab needs a ZIP that includes HTML files.',
        guide4: 'A thumbnail image is optional.',
        zipResult: 'ZIP check result',
        helper: 'Help',
        zipDone: 'ZIP check complete',
        entry: 'Entry file',
        htmlCount: 'HTML files',
        thumbCount: 'Thumbnail candidates',
        flagged: 'We found an external link and may review it once more.',
        safe: 'No external link issue was found yet.',
        zipHint: 'Use Check ZIP First to preview the entry file and thumbnail candidates.',
        htmlHint: 'Upload your HTML file and press Upload Game.',
        success: 'Your game is live!',
        open: 'Open',
        successFlagged: 'The upload worked. We may review one external link.',
        errTitle: 'Please enter a game title.',
        errDesc: 'Please enter a game description.',
        errHtml: 'Please choose an HTML file.',
        errZip: 'Please choose a ZIP file.',
        errInspect: 'Could not inspect the ZIP file.',
        errInspectFallback: 'Something went wrong while checking the ZIP file.',
        errPublish: 'Could not upload the game.',
        errPublishFallback: 'Something went wrong while uploading the game.'
      };
}

export default function SubmitForm({ userLoginId, locale }: { userLoginId: string; locale: Locale }) {
  const [mode, setMode] = useState<UploadMode>('html');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [htmlFile, setHtmlFile] = useState<File | null>(null);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [inspectResult, setInspectResult] = useState<InspectResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<PublishResponse | null>(null);
  const [isInspecting, setIsInspecting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const copy = useMemo(() => getCopy(locale), [locale]);

  function validateForm() {
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
    if (!validateForm() || !zipFile) {
      return null;
    }

    setError(null);
    setSuccess(null);
    setIsInspecting(true);

    try {
      const formData = new FormData();
      formData.append('file', zipFile);
      if (thumbnailFile) {
        formData.append('thumbnail', thumbnailFile);
      }

      const response = await fetch('/api/upload/zip-inspect', {
        method: 'POST',
        body: formData
      });

      const data = (await response.json()) as InspectResponse | ErrorResponse;
      if (!response.ok || !('inspectionId' in data)) {
        throw new Error(('error' in data ? data.error : undefined) ?? copy.errInspect);
      }

      setInspectResult(data);
      return data;
    } catch (cause) {
      setInspectResult(null);
      setError(cause instanceof Error ? cause.message : copy.errInspectFallback);
      return null;
    } finally {
      setIsInspecting(false);
    }
  }

  async function requestPublish(inspectionId: string) {
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

    const data = (await response.json()) as PublishResponse | ErrorResponse;
    return { response, data };
  }

  async function publishGame() {
    if (!validateForm()) {
      return;
    }

    setError(null);
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

        const data = (await response.json()) as PublishResponse | ErrorResponse;
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
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : copy.errPublishFallback);
    } finally {
      setIsPublishing(false);
    }
  }

  function resetForm() {
    setInspectResult(null);
    setZipFile(null);
    setThumbnailFile(null);
    setHtmlFile(null);
    setTitle('');
    setDescription('');
    const htmlInput = document.getElementById('html-upload') as HTMLInputElement | null;
    const zipInput = document.getElementById('zip-upload') as HTMLInputElement | null;
    const thumbInput = document.getElementById('thumbnail-upload') as HTMLInputElement | null;
    if (htmlInput) htmlInput.value = '';
    if (zipInput) zipInput.value = '';
    if (thumbInput) thumbInput.value = '';
  }

  return (
    <div className="submit-layout">
      <div className="panel-card panel-card-form">
        <div className="panel-card-head">
          <span className="pill-label">Maker upload</span>
          <h2>
            {userLoginId}
            {copy.title}
          </h2>
          <p>{copy.subtitle}</p>
        </div>

        <label className="field-label">
          {copy.gameTitle}
          <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={80} required />
        </label>

        <label className="field-label">
          {copy.gameDescription}
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
            maxLength={400}
            placeholder={copy.descriptionPlaceholder}
            required
          />
        </label>

        <div className="tab-row auth-tabs">
          <button
            type="button"
            className={`button-ghost auth-tab${mode === 'html' ? ' is-active' : ''}`}
            onClick={() => {
              setMode('html');
              setInspectResult(null);
              setError(null);
            }}
          >
            {copy.tabHtml}
          </button>
          <button
            type="button"
            className={`button-ghost auth-tab${mode === 'zip' ? ' is-active' : ''}`}
            onClick={() => {
              setMode('zip');
              setInspectResult(null);
              setError(null);
            }}
          >
            {copy.tabZip}
          </button>
        </div>

        {mode === 'html' ? (
          <label className="field-label">
            {copy.html}
            <input
              id="html-upload"
              type="file"
              accept=".html,.htm,text/html"
              onChange={(event) => {
                setHtmlFile(event.target.files?.[0] ?? null);
                setError(null);
              }}
              required
            />
            <span className="small-copy upload-input-hint">{copy.htmlHintLabel}</span>
          </label>
        ) : (
          <label className="field-label">
            {copy.zip}
            <input
              id="zip-upload"
              type="file"
              accept=".zip,application/zip"
              onChange={(event) => {
                setZipFile(event.target.files?.[0] ?? null);
                setInspectResult(null);
                setError(null);
              }}
              required
            />
          </label>
        )}

        <label className="field-label">
          {copy.thumbnail}
          <input
            type="file"
            id="thumbnail-upload"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={(event) => {
              setThumbnailFile(event.target.files?.[0] ?? null);
              setInspectResult(null);
              setError(null);
            }}
          />
        </label>

        <div className="button-row">
          {mode === 'zip' ? (
            <button type="button" className="button-secondary button-fill" onClick={() => void runZipInspection()} disabled={isInspecting || isPublishing}>
              {isInspecting ? copy.inspecting : copy.inspect}
            </button>
          ) : null}
          <button type="button" className="button-primary button-fill" onClick={() => void publishGame()} disabled={isInspecting || isPublishing}>
            {isPublishing ? copy.publishing : copy.publish}
          </button>
        </div>

        {error ? <p className="error-text">{error}</p> : null}

        {success ? (
          <div className="status-card status-success">
            <p className="status-title">{copy.success}</p>
            <p className="small-copy">
              {copy.open}: <a href={success.gameUrl}>{success.gameUrl}</a>
            </p>
            {success.flagged ? <p className="small-copy">{copy.successFlagged}</p> : null}
          </div>
        ) : null}
      </div>

      <div className="submit-side">
        <div className="panel-card">
          <h3>{copy.uploadGuide}</h3>
          <ul className="upload-rules">
            <li>{copy.guide1}</li>
            <li>{copy.guide2}</li>
            <li>{copy.guide3}</li>
            <li>{copy.guide4}</li>
          </ul>
        </div>

        <div className="panel-card">
          <h3>{mode === 'zip' ? copy.zipResult : copy.helper}</h3>
          {mode === 'zip' && inspectResult ? (
            <div className="status-card">
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
              <p className="small-copy">{inspectResult.allowlistViolation ? copy.flagged : copy.safe}</p>
            </div>
          ) : (
            <p className="small-copy">{mode === 'zip' ? copy.zipHint : copy.htmlHint}</p>
          )}
        </div>
      </div>
    </div>
  );
}
