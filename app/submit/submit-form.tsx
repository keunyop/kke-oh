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
      setError('Add a game title before uploading.');
      return false;
    }

    if (description.trim().length < 10) {
      setError('Write a short description with at least 10 characters.');
      return false;
    }

    if (!file) {
      setError('Choose a ZIP file to continue.');
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
        throw new Error(('error' in data ? data.error : undefined) ?? 'Could not inspect the ZIP file.');
      }

      setInspectResult(data);
      return data;
    } catch (cause) {
      setInspectResult(null);
      setError(cause instanceof Error ? cause.message : 'Something went wrong while inspecting the ZIP file.');
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

      if (response.status === 410) {
        inspection = await runZipInspection();
        if (!inspection) {
          return;
        }
        ({ response, data } = await requestPublish(inspection.inspectionId));
      }

      if (!response.ok || !('ok' in data)) {
        throw new Error(('error' in data ? data.error : undefined) ?? 'Could not publish the game.');
      }

      setSuccess(data);
      setInspectResult(null);
      setFile(null);
      setTitle('');
      setDescription('');
      const input = document.getElementById('zip-upload') as HTMLInputElement | null;
      if (input) input.value = '';
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Something went wrong while publishing the game.');
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
      <div className="panel-card panel-card-form">
        <div className="panel-card-head">
          <span className="pill-label">Maker upload</span>
          <h2>Bring your HTML game to life.</h2>
          <p>Upload one ZIP package with your web game files and a clear description so players know what to expect.</p>
        </div>

        <label className="field-label">
          Game title
          <input value={title} onChange={(event) => handleTitleChange(event.target.value)} maxLength={80} required />
        </label>

        <label className="field-label">
          Description
          <textarea
            value={description}
            onChange={(event) => handleDescriptionChange(event.target.value)}
            rows={5}
            maxLength={400}
            required
          />
        </label>

        <label className="field-label">
          ZIP file
          <input
            id="zip-upload"
            type="file"
            accept=".zip,application/zip"
            onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)}
            required
          />
        </label>

        <div className="button-row">
          <button type="button" className="button-secondary button-fill" onClick={inspectZip} disabled={isInspecting || isPublishing}>
            {isInspecting ? 'Checking ZIP...' : 'Inspect ZIP'}
          </button>
          <button type="button" className="button-primary button-fill" onClick={publishGame} disabled={isInspecting || isPublishing}>
            {isPublishing ? 'Publishing...' : 'Publish Game'}
          </button>
        </div>

        {error ? <p className="error-text">{error}</p> : null}

        {success ? (
          <div className="status-card status-success">
            <p className="status-title">Your game is live.</p>
            <p className="small-copy">
              Public link: <a href={success.gameUrl}>{success.gameUrl}</a>
            </p>
            {success.flagged ? (
              <p className="small-copy">An external URL was flagged for review, but the upload completed successfully.</p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="submit-side">
        <div className="panel-card">
          <h3>Upload rules</h3>
          <ul className="upload-rules">
            <li>Your ZIP must include an `index.html` file.</li>
            <li>Allowed files: html, css, js, png, jpg, webp, gif, svg, mp3, ogg, wav, json, txt, wasm.</li>
            <li>ZIP files can be up to 15 MB with up to 200 files inside.</li>
            <li>Approved uploads appear in the library right away.</li>
          </ul>
        </div>

        <div className="panel-card">
          <h3>Safety check</h3>
          {inspectResult ? (
            <div className="status-card">
              <p className="status-title">ZIP inspection complete</p>
              <p className="small-copy">Entry file: {inspectResult.entryPath}</p>
              <p className="small-copy">HTML files: {inspectResult.htmlFiles.length}</p>
              <p className="small-copy">Thumbnail candidates: {inspectResult.thumbnailCandidates.length}</p>
              {inspectResult.allowlistViolation ? (
                <p className="small-copy">One or more external URLs need review before the game can stay in the library.</p>
              ) : (
                <p className="small-copy">No external URL issues were detected.</p>
              )}
            </div>
          ) : (
            <p className="small-copy">Run an inspection to preview entry files, thumbnails, and basic safety signals before publishing.</p>
          )}
        </div>
      </div>
    </div>
  );
}
