'use client';

import { useState } from 'react';

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

export default function SubmitForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [inspectResult, setInspectResult] = useState<InspectResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<PublishResponse | null>(null);
  const [isInspecting, setIsInspecting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  function validateForm() {
    if (!title.trim()) {
      setError('게임 제목을 입력해 주세요.');
      return false;
    }

    if (description.trim().length < 10) {
      setError('설명은 10자 이상 입력해 주세요.');
      return false;
    }

    if (!file) {
      setError('ZIP 파일을 선택해 주세요.');
      return false;
    }

    return true;
  }

  async function runZipInspection() {
    if (!validateForm() || !file) {
      return null;
    }

    setError(null);
    setSuccess(null);
    setIsInspecting(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload/zip-inspect', {
        method: 'POST',
        body: formData
      });

      const data = (await response.json()) as InspectResponse | ErrorResponse;
      if (!response.ok || !('inspectionId' in data)) {
        throw new Error(('error' in data ? data.error : undefined) ?? 'ZIP 검사에 실패했습니다.');
      }

      setInspectResult(data);
      return data;
    } catch (cause) {
      setInspectResult(null);
      setError(cause instanceof Error ? cause.message : 'ZIP 검사 중 오류가 발생했습니다.');
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
      let inspection = inspectResult ?? (await runZipInspection());
      if (!inspection) {
        return;
      }

      let { response, data } = await requestPublish(inspection.inspectionId);

      // Dev server reloads can clear the in-memory upload cache. Re-run inspection once and retry.
      if (response.status === 410) {
        inspection = await runZipInspection();
        if (!inspection) {
          return;
        }
        ({ response, data } = await requestPublish(inspection.inspectionId));
      }

      if (!response.ok || !('ok' in data)) {
        throw new Error(('error' in data ? data.error : undefined) ?? '게임 게시에 실패했습니다.');
      }

      setSuccess(data);
      setInspectResult(null);
      setFile(null);
      setTitle('');
      setDescription('');
      const input = document.getElementById('zip-upload') as HTMLInputElement | null;
      if (input) input.value = '';
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '게임 게시 중 오류가 발생했습니다.');
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

  function handleFileChange(nextFile: File | null) {
    setFile(nextFile);
    setInspectResult(null);
    setError(null);
  }

  return (
    <div className="submit-layout">
      <div className="card">
        <h1>게임 올리기</h1>
        <p className="small">HTML 게임을 ZIP으로 압축해서 업로드하면 사이트에 바로 공개됩니다.</p>
        <label>
          게임 제목
          <input value={title} onChange={(event) => handleTitleChange(event.target.value)} maxLength={80} required />
        </label>
        <label>
          설명
          <textarea
            value={description}
            onChange={(event) => handleDescriptionChange(event.target.value)}
            rows={5}
            maxLength={400}
            required
          />
        </label>
        <label>
          ZIP 파일
          <input
            id="zip-upload"
            type="file"
            accept=".zip,application/zip"
            onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)}
            required
          />
        </label>
        <div className="inline">
          <button type="button" className="secondary" onClick={inspectZip} disabled={isInspecting || isPublishing}>
            {isInspecting ? '검사 중...' : 'ZIP 검사'}
          </button>
          <button type="button" onClick={publishGame} disabled={isInspecting || isPublishing}>
            {isPublishing ? '게시 중...' : '게임 게시'}
          </button>
        </div>
        {error ? <p className="error-text">{error}</p> : null}
        {success ? (
          <div className="status-card success">
            <p>업로드가 완료되었습니다.</p>
            <p className="small">
              공개 주소: <a href={success.gameUrl}>{success.gameUrl}</a>
            </p>
            {success.flagged ? (
              <p className="small">외부 URL이 감지되어 관리자 검토 대상에 표시됩니다.</p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="card">
        <h2>업로드 규칙</h2>
        <ul className="upload-rules">
          <li>`index.html`을 포함한 HTML 게임 ZIP만 허용됩니다.</li>
          <li>허용 확장자: html, css, js, png, jpg, webp, gif, svg, mp3, ogg, wav, json, txt, wasm</li>
          <li>ZIP 최대 15MB, 파일 개수 최대 200개입니다.</li>
          <li>업로드 후 바로 목록과 게임 페이지에 반영됩니다.</li>
        </ul>
        {inspectResult ? (
          <div className="status-card">
            <p>검사 완료</p>
            <p className="small">실행 파일: {inspectResult.entryPath}</p>
            <p className="small">HTML 파일 수: {inspectResult.htmlFiles.length}</p>
            <p className="small">썸네일 후보 수: {inspectResult.thumbnailCandidates.length}</p>
            {inspectResult.allowlistViolation ? (
              <p className="small">허용 목록 밖의 외부 URL이 감지되었습니다. 업로드는 가능하지만 운영자가 확인할 수 있습니다.</p>
            ) : (
              <p className="small">외부 URL 문제는 감지되지 않았습니다.</p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
