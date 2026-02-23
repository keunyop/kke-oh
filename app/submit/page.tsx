'use client';

import { useMemo, useState } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (el: string | HTMLElement, opts: { sitekey: string; callback: (token: string) => void }) => void;
    };
  }
}

export default function SubmitPage() {
  const [tab, setTab] = useState<'zip' | 'paste'>('zip');
  const [token, setToken] = useState('');
  const [inspect, setInspect] = useState<{ inspectId: string; htmlFiles: string[]; defaultEntryPath: string; allowlistViolation: boolean } | null>(null);
  const [message, setMessage] = useState('');

  const siteKey = useMemo(() => process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '', []);

  async function inspectZip(formData: FormData) {
    formData.append('turnstileToken', token);
    const res = await fetch('/api/upload/zip-inspect', { method: 'POST', body: formData });
    const json = await res.json();
    if (!res.ok) return setMessage(json.error || 'Inspect failed');
    setInspect(json);
    setMessage('ZIP inspected. Choose your entry HTML and confirm publish.');
  }

  async function confirmZip(formData: FormData) {
    const res = await fetch('/api/upload/confirm', { method: 'POST', body: formData });
    const json = await res.json();
    if (!res.ok) return setMessage(json.error || 'Confirm failed');
    setMessage(`Published! Play at /game/${json.gameId}${json.isHidden ? ' (auto-hidden due to safety violation)' : ''}`);
  }

  async function submitPaste(formData: FormData) {
    formData.append('turnstileToken', token);
    const res = await fetch('/api/upload/paste', { method: 'POST', body: formData });
    const json = await res.json();
    if (!res.ok) return setMessage(json.error || 'Submit failed');
    setMessage(`Published! Play at /game/${json.gameId}${json.isHidden ? ' (auto-hidden due to safety violation)' : ''}`);
  }

  return (
    <section>
      <h1>Submit a game</h1>
      <div className="tab-row">
        <button className={tab === 'zip' ? '' : 'secondary'} onClick={() => setTab('zip')}>ZIP upload</button>
        <button className={tab === 'paste' ? '' : 'secondary'} onClick={() => setTab('paste')}>Paste HTML</button>
      </div>

      <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
      <div id="turnstile-box" className="card" ref={(el) => {
        if (el && siteKey && window.turnstile) {
          window.turnstile.render(el, { sitekey: siteKey, callback: setToken });
        }
      }}>
        <p className="small">Turnstile token required before upload.</p>
      </div>

      {tab === 'zip' ? (
        <>
          <form className="card" action={inspectZip}>
            <h3>1) Inspect ZIP</h3>
            <label>Email (optional)</label>
            <input name="email" type="email" />
            <label>ZIP file (max 50MB)</label>
            <input name="zip" type="file" accept=".zip" required />
            <button type="submit">Inspect ZIP</button>
          </form>

          {inspect ? (
            <form className="card" action={confirmZip}>
              <h3>2) Confirm publish</h3>
              <input name="inspectId" defaultValue={inspect.inspectId} hidden readOnly />
              <label>Title</label>
              <input name="title" required />
              <label>Description</label>
              <textarea name="description" rows={3} />
              <label>Email (optional)</label>
              <input name="email" type="email" />
              <label>Entry HTML file</label>
              <select name="entryPath" defaultValue={inspect.defaultEntryPath}>
                {inspect.htmlFiles.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
              <label>Thumbnail (optional)</label>
              <input name="thumbnail" type="file" accept="image/*" />
              {inspect.allowlistViolation ? <p className="small">⚠ External URL allowlist violation detected. Game will auto-hide.</p> : null}
              <button type="submit">Publish Game</button>
            </form>
          ) : null}
        </>
      ) : (
        <form className="card" action={submitPaste}>
          <h3>Paste HTML</h3>
          <label>Title</label>
          <input name="title" required />
          <label>Description</label>
          <textarea name="description" rows={3} />
          <label>Email (optional)</label>
          <input name="email" type="email" />
          <label>HTML content</label>
          <textarea name="html" rows={12} required />
          <label>Thumbnail (optional)</label>
          <input name="thumbnail" type="file" accept="image/*" />
          <button type="submit">Publish Game</button>
        </form>
      )}

      {message ? <p className="card">{message}</p> : null}
    </section>
  );
}
