'use client';

import { useMemo, useState } from 'react';
import { getDictionary, type Locale } from '@/lib/i18n';

type AuthMode = 'login' | 'signup';

type AuthResponse = {
  ok?: boolean;
  error?: string;
};

export default function LoginForm({ nextPath, locale }: { nextPath: string; locale: Locale }) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const t = getDictionary(locale);

  const title = useMemo(
    () => (mode === 'login' ? t.login.titleLogin : t.login.titleSignup),
    [mode, t.login.titleLogin, t.login.titleSignup]
  );

  const description = useMemo(
    () => (mode === 'login' ? t.login.descriptionLogin : t.login.descriptionSignup),
    [mode, t.login.descriptionLogin, t.login.descriptionSignup]
  );

  async function submit() {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(mode === 'login' ? '/api/auth/login' : '/api/auth/signup', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          loginId,
          password
        })
      });

      const data = (await response.json()) as AuthResponse;
      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? (locale === 'ko' ? '다시 시도해주세요.' : 'Please try again.'));
      }

      window.location.href = nextPath || '/';
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : locale === 'ko' ? '다시 시도해주세요.' : 'Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="login-card panel-card auth-card-centered">
      <div className="tab-row auth-tabs">
        <button
          type="button"
          className={`button-ghost auth-tab${mode === 'login' ? ' is-active' : ''}`}
          onClick={() => setMode('login')}
        >
          {t.login.tabLogin}
        </button>
        <button
          type="button"
          className={`button-ghost auth-tab${mode === 'signup' ? ' is-active' : ''}`}
          onClick={() => setMode('signup')}
        >
          {t.login.tabSignup}
        </button>
      </div>

      <div className="panel-card-head auth-card-head">
        <h1>{title}</h1>
        <p>{description}</p>
      </div>

      <label className="field-label">
        <span>ID</span>
        <input
          value={loginId}
          onChange={(event) => setLoginId(event.target.value)}
          placeholder={t.login.idPlaceholder}
          maxLength={24}
          autoComplete="username"
        />
      </label>

      <label className="field-label">
        <span>{locale === 'ko' ? '비밀번호' : 'Password'}</span>
        <input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder={t.login.passwordPlaceholder}
          type="password"
          maxLength={80}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
        />
      </label>

      {error ? <p className="error-text auth-error-text">{error}</p> : null}

      <button type="button" className="button-primary button-fill" onClick={submit} disabled={isSubmitting}>
        {isSubmitting ? t.login.pending : mode === 'login' ? t.login.submitLogin : t.login.submitSignup}
      </button>
    </div>
  );
}

