'use client';

import { useMemo, useState } from 'react';

type AuthMode = 'login' | 'signup';

type AuthResponse = {
  ok?: boolean;
  error?: string;
};

export default function LoginForm({ nextPath }: { nextPath: string }) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const title = useMemo(
    () => (mode === 'login' ? '다시 만나서 반가워요!' : '바로 시작해볼까요?'),
    [mode]
  );

  const description = useMemo(
    () =>
      mode === 'login'
        ? 'ID와 비밀번호만 입력하면 바로 들어갈 수 있어요.'
        : '이메일 없이도 괜찮아요. ID와 비밀번호만 만들면 끝이에요.',
    [mode]
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
        throw new Error(data.error ?? '다시 시도해주세요.');
      }

      window.location.href = nextPath || '/';
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="login-card panel-card">
      <div className="tab-row auth-tabs">
        <button
          type="button"
          className={`button-ghost auth-tab${mode === 'login' ? ' is-active' : ''}`}
          onClick={() => setMode('login')}
        >
          로그인
        </button>
        <button
          type="button"
          className={`button-ghost auth-tab${mode === 'signup' ? ' is-active' : ''}`}
          onClick={() => setMode('signup')}
        >
          회원가입
        </button>
      </div>

      <div className="panel-card-head">
        <span className="pill-label">Login</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>

      <label className="field-label">
        ID
        <input
          value={loginId}
          onChange={(event) => setLoginId(event.target.value)}
          placeholder="예: gamekid"
          maxLength={24}
          autoComplete="username"
        />
      </label>

      <label className="field-label">
        비밀번호
        <input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="쉬운 비밀번호도 괜찮아요"
          type="password"
          maxLength={80}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
        />
      </label>

      <button type="button" className="button-primary button-fill" onClick={submit} disabled={isSubmitting}>
        {isSubmitting ? '잠깐만요...' : mode === 'login' ? '로그인하기' : '회원가입하고 시작하기'}
      </button>

      {error ? <p className="error-text">{error}</p> : null}

      <p className="small-copy">이메일 인증 없이 ID와 비밀번호만으로 바로 이용할 수 있어요.</p>
    </div>
  );
}
