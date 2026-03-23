'use client';

import { useMemo, useState, useTransition, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { buildAiDraftLaunchPath } from '@/lib/ai/home-entry';
import type { Locale } from '@/lib/i18n';

type HomeAiModel = {
  id: string;
  label: string;
  kidDescription: string;
  pointCostCreate: number;
};

type Props = {
  locale: Locale;
  models: HomeAiModel[];
  isLoggedIn: boolean;
  pointBalance: number | null;
};

function tx(locale: Locale, ko: string, en: string) {
  return locale === 'ko' ? ko : en;
}

export function HomeAiStarter({ locale, models, isLoggedIn, pointBalance }: Props) {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [modelId, setModelId] = useState(models[0]?.id ?? '');
  const [isPending, startTransition] = useTransition();
  const selectedModel = useMemo(() => models.find((model) => model.id === modelId) ?? models[0] ?? null, [modelId, models]);
  const trimmedPrompt = prompt.trim();
  const canContinue = trimmedPrompt.length >= 8 && Boolean(selectedModel) && !isPending;
  const balanceValue = typeof pointBalance === 'number' ? `${pointBalance}P` : tx(locale, '로그인 후', 'After login');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedModel || trimmedPrompt.length < 8) {
      return;
    }

    const submitPath = buildAiDraftLaunchPath({
      prompt: trimmedPrompt,
      modelId: selectedModel.id
    });
    const nextPath = isLoggedIn ? submitPath : `/login?next=${encodeURIComponent(submitPath)}`;

    startTransition(() => {
      router.push(nextPath);
    });
  }

  return (
    <section className="panel-card home-ai-starter" aria-labelledby="home-ai-starter-title">
      <div className="home-ai-starter-copy">
        <h1 id="home-ai-starter-title">{tx(locale, '원하는 게임 아이디어를 적어보세요', 'Write the game idea you want')}</h1>
        <p>
          {tx(
            locale,
            '캐릭터, 목표, 조작만 적어도 괜찮아요. 다음 화면에서 이어서 초안 게임으로 만들 수 있어요.',
            'A character, a goal, and simple controls are enough. We will carry this into the full draft builder on the next screen.'
          )}
        </p>
      </div>

      <form className="home-ai-starter-form" onSubmit={handleSubmit}>
        <label className="field-label">
          <span>{tx(locale, 'AI에게 어떤 게임을 만들지 알려주세요', 'Tell AI what game to build')}</span>
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            rows={5}
            maxLength={1200}
            placeholder={tx(
              locale,
              '예: 우주에서 별을 피하고 코인을 모으는 쉬운 게임을 만들어줘.',
              'Example: Make an easy space game where players dodge stars and collect coins.'
            )}
          />
        </label>

        <div className="home-ai-starter-row">
          <label className="field-label home-ai-starter-model-field">
            <span>{tx(locale, 'AI 도우미 고르기', 'Pick an AI helper')}</span>
            <select value={modelId} onChange={(event) => setModelId(event.target.value)}>
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.label}
                </option>
              ))}
            </select>
          </label>

          <div className="home-ai-starter-model-card" aria-live="polite">
            <div className="home-ai-starter-model-stat">
              <span className="small-copy">{tx(locale, '필요', 'Cost')}</span>
              <strong>{selectedModel ? `${selectedModel.pointCostCreate}P` : '-'}</strong>
            </div>
            <div className="home-ai-starter-model-stat">
              <span className="small-copy">{tx(locale, '남은 포인트', 'Points')}</span>
              <strong className={typeof pointBalance === 'number' ? '' : 'home-ai-starter-stat-text'}>{balanceValue}</strong>
            </div>
          </div>
        </div>

        <div className="home-ai-starter-actions">
          <button type="submit" className="button-primary" disabled={!canContinue}>
            {isLoggedIn ? tx(locale, 'AI로 만들기', 'Create with AI') : tx(locale, '로그인하고 AI로 만들기', 'Log in to create with AI')}
          </button>
          <a href="/submit" className="button-secondary">
            {tx(locale, '내 파일 올리기', 'Upload my files')}
          </a>
        </div>

        <p className="small-copy home-ai-starter-helper">
          {trimmedPrompt.length >= 8
            ? tx(locale, '좋아요. 다음 화면에서 이름, 설명, 썸네일까지 더 정할 수 있어요.', 'Nice. On the next screen you can also set the name, description, and thumbnail.')
            : tx(locale, '8자 이상 적으면 바로 다음 단계로 넘길 수 있어요.', 'Write at least 8 characters to move into the next step.')}
        </p>
      </form>
    </section>
  );
}
