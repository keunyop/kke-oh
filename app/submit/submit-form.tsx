'use client';

import { useState } from 'react';

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

export default function SubmitForm({ userLoginId }: { userLoginId: string }) {
  const [mode, setMode] = useState<UploadMode>('html');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [html, setHtml] = useState('');
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [inspectResult, setInspectResult] = useState<InspectResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<PublishResponse | null>(null);
  const [isInspecting, setIsInspecting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  function validateForm() {
    if (!title.trim()) {
      setError('게임 이름을 적어주세요.');
      return false;
    }

    if (!description.trim()) {
      setError('게임 설명을 적어주세요.');
      return false;
    }

    if (mode === 'html' && !html.trim()) {
      setError('HTML 코드를 넣어주세요.');
      return false;
    }

    if (mode === 'zip' && !zipFile) {
      setError('ZIP 파일을 골라주세요.');
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
        throw new Error(('error' in data ? data.error : undefined) ?? 'ZIP 파일을 확인하지 못했어요.');
      }

      setInspectResult(data);
      return data;
    } catch (cause) {
      setInspectResult(null);
      setError(cause instanceof Error ? cause.message : 'ZIP 파일을 확인하는 중 문제가 생겼어요.');
      return null;
    } finally {
      setIsInspecting(false);
    }
  }

  async function inspectZip() {
    await runZipInspection();
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
        formData.append('html', html);
        if (thumbnailFile) {
          formData.append('thumbnail', thumbnailFile);
        }

        const response = await fetch('/api/upload/paste', {
          method: 'POST',
          body: formData
        });

        const data = (await response.json()) as PublishResponse | ErrorResponse;
        if (!response.ok || !('ok' in data)) {
          throw new Error(('error' in data ? data.error : undefined) ?? '게임을 올리지 못했어요.');
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
        throw new Error(('error' in data ? data.error : undefined) ?? '게임을 올리지 못했어요.');
      }

      setSuccess(data);
      resetForm();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '게임을 올리는 중 문제가 생겼어요.');
    } finally {
      setIsPublishing(false);
    }
  }

  function handleTitleChange(value: string) {
    setTitle(value);
    setInspectResult(null);
    setError(null);
  }

  function handleDescriptionChange(value: string) {
    setDescription(value);
    setInspectResult(null);
    setError(null);
  }

  function handleZipFileChange(nextFile: File | null) {
    setZipFile(nextFile);
    setInspectResult(null);
    setError(null);
  }

  function handleThumbnailFileChange(nextFile: File | null) {
    setThumbnailFile(nextFile);
    setInspectResult(null);
    setError(null);
  }

  function resetForm() {
    setInspectResult(null);
    setZipFile(null);
    setThumbnailFile(null);
    setTitle('');
    setDescription('');
    setHtml('');
    const zipInput = document.getElementById('zip-upload') as HTMLInputElement | null;
    const thumbInput = document.getElementById('thumbnail-upload') as HTMLInputElement | null;
    if (zipInput) zipInput.value = '';
    if (thumbInput) thumbInput.value = '';
  }

  return (
    <div className="submit-layout">
      <div className="panel-card panel-card-form">
        <div className="panel-card-head">
          <span className="pill-label">Maker upload</span>
          <h2>{userLoginId} 님의 새 게임</h2>
          <p>아래에서 편한 방법 하나만 골라서 올려주세요.</p>
        </div>

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
            HTML 직접 입력
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
            ZIP 파일 업로드
          </button>
        </div>

        <label className="field-label">
          게임 이름
          <input value={title} onChange={(event) => handleTitleChange(event.target.value)} maxLength={80} required />
        </label>

        <label className="field-label">
          게임 설명
          <textarea
            value={description}
            onChange={(event) => handleDescriptionChange(event.target.value)}
            rows={4}
            maxLength={400}
            placeholder="친구들에게 어떤 게임인지 쉽게 알려주세요."
            required
          />
        </label>

        {mode === 'html' ? (
          <label className="field-label">
            HTML
            <textarea
              value={html}
              onChange={(event) => {
                setHtml(event.target.value);
                setError(null);
              }}
              rows={12}
              className="code-area"
              placeholder="<html>...</html>"
              required
            />
          </label>
        ) : (
          <label className="field-label">
            ZIP 파일
            <input
              id="zip-upload"
              type="file"
              accept=".zip,application/zip"
              onChange={(event) => handleZipFileChange(event.target.files?.[0] ?? null)}
              required
            />
          </label>
        )}

        <label className="field-label">
          썸네일 이미지 (선택)
          <input
            type="file"
            id="thumbnail-upload"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={(event) => handleThumbnailFileChange(event.target.files?.[0] ?? null)}
          />
        </label>

        <div className="button-row">
          {mode === 'zip' ? (
            <button type="button" className="button-secondary button-fill" onClick={inspectZip} disabled={isInspecting || isPublishing}>
              {isInspecting ? 'ZIP 확인 중...' : 'ZIP 먼저 확인하기'}
            </button>
          ) : null}
          <button type="button" className="button-primary button-fill" onClick={publishGame} disabled={isInspecting || isPublishing}>
            {isPublishing ? '올리는 중...' : '게임 올리기'}
          </button>
        </div>

        {error ? <p className="error-text">{error}</p> : null}

        {success ? (
          <div className="status-card status-success">
            <p className="status-title">게임이 올라갔어요!</p>
            <p className="small-copy">
              바로 가기: <a href={success.gameUrl}>{success.gameUrl}</a>
            </p>
            {success.flagged ? (
              <p className="small-copy">바깥 링크가 보여서 한 번 더 확인만 필요해요. 업로드는 완료됐어요.</p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="submit-side">
        <div className="panel-card">
          <h3>쉽게 올리는 방법</h3>
          <ul className="upload-rules">
            <li>게임 이름과 설명은 꼭 적어주세요.</li>
            <li>HTML 직접 입력 탭에서는 HTML 코드가 꼭 필요해요.</li>
            <li>ZIP 탭에서는 HTML 파일이 들어 있는 ZIP이 꼭 필요해요.</li>
            <li>썸네일 이미지는 선택이라서 없어도 괜찮아요.</li>
          </ul>
        </div>

        <div className="panel-card">
          <h3>{mode === 'zip' ? 'ZIP 확인 결과' : '도움말'}</h3>
          {mode === 'zip' && inspectResult ? (
            <div className="status-card">
              <p className="status-title">ZIP 확인 완료</p>
              <p className="small-copy">시작 파일: {inspectResult.entryPath}</p>
              <p className="small-copy">HTML 파일 수: {inspectResult.htmlFiles.length}</p>
              <p className="small-copy">썸네일 후보 수: {inspectResult.thumbnailCandidates.length}</p>
              {inspectResult.allowlistViolation ? (
                <p className="small-copy">바깥 링크가 보여서 한 번 더 확인할 수 있어요.</p>
              ) : (
                <p className="small-copy">바깥 링크 문제는 아직 보이지 않았어요.</p>
              )}
            </div>
          ) : (
            <p className="small-copy">
              {mode === 'zip'
                ? 'ZIP 먼저 확인하기를 누르면 시작 파일과 썸네일 후보를 미리 볼 수 있어요.'
                : 'HTML을 붙여넣고 바로 게임 올리기를 누르면 돼요.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
