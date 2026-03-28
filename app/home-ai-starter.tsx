'use client';

import { useEffect, useMemo, useState, useTransition, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { AiProgressCard } from '@/components/ai/ai-progress-card';
import { PointShortageDialog } from '@/components/points/point-shortage-dialog';
import { AI_CREATE_PROGRESS_STEP_DELAYS, getAiCreateProgressCopy } from '@/lib/ai/create-progress';
import { buildAiDraftLaunchPath } from '@/lib/ai/home-entry';
import { getDefaultAiModel, getDefaultAiModelId } from '@/lib/ai/model-selection';
import type { Locale } from '@/lib/i18n';

type HomeAiModel = {
  id: string;
  label: string;
  kidDescription: string;
  pointCostCreate: number;
};

type PublishResponse = {
  ok: true;
  gameId: string;
  gameUrl: string;
  flagged: boolean;
  pointsSpent?: number;
};

type ErrorResponse = {
  error?: string;
  requiredPoints?: number;
  balance?: number;
};

type CompletedGame = {
  gameId: string;
  gameUrl: string;
  pointsSpent: number;
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
  const [modelId, setModelId] = useState(getDefaultAiModelId(models));
  const [homePointBalance, setHomePointBalance] = useState<number | null>(pointBalance);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createdGame, setCreatedGame] = useState<CompletedGame | null>(null);
  const [aiProgressStep, setAiProgressStep] = useState(0);
  const [aiProgressDots, setAiProgressDots] = useState(1);
  const [shortageDialogOpen, setShortageDialogOpen] = useState(false);
  const [shortageRequiredPoints, setShortageRequiredPoints] = useState(0);
  const [isPending, startTransition] = useTransition();
  const selectedModel = useMemo(() => models.find((model) => model.id === modelId) ?? getDefaultAiModel(models), [modelId, models]);
  const trimmedPrompt = prompt.trim();
  const canContinue = trimmedPrompt.length >= 8 && Boolean(selectedModel) && !isPending && !isCreating;
  const balanceValue = typeof homePointBalance === 'number' ? `${homePointBalance}P` : tx(locale, '로그인 후 확인', 'After login');
  const aiProgressCopy = getAiCreateProgressCopy(locale);

  useEffect(() => {
    setHomePointBalance(pointBalance);
  }, [pointBalance]);

  useEffect(() => {
    setModelId((current) => {
      if (current && models.some((model) => model.id === current)) {
        return current;
      }

      return getDefaultAiModelId(models);
    });
  }, [models]);

  useEffect(() => {
    if (!isCreating) {
      setAiProgressStep(0);
      setAiProgressDots(1);
      return;
    }

    setAiProgressStep(0);
    setAiProgressDots(1);

    const timers = AI_CREATE_PROGRESS_STEP_DELAYS.map((delay, index) => window.setTimeout(() => setAiProgressStep(index + 1), delay));
    const dotsTimer = window.setInterval(() => {
      setAiProgressDots((current) => (current % 3) + 1);
    }, 420);

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      window.clearInterval(dotsTimer);
    };
  }, [isCreating]);

  function openPointShortageDialog(requiredPoints: number, balance = homePointBalance ?? 0) {
    setHomePointBalance(balance);
    setShortageRequiredPoints(requiredPoints);
    setShortageDialogOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedModel || trimmedPrompt.length < 8) {
      return;
    }

    setError(null);
    setCreatedGame(null);

    const submitPath = buildAiDraftLaunchPath({
      prompt: trimmedPrompt,
      modelId: selectedModel.id
    });

    if (!isLoggedIn) {
      startTransition(() => {
        router.push(`/login?next=${encodeURIComponent(submitPath)}`);
      });
      return;
    }

    setIsCreating(true);

    try {
      const formData = new FormData();
      formData.append('prompt', trimmedPrompt);
      formData.append('modelId', selectedModel.id);

      const response = await fetch('/api/upload/generate-v2', {
        method: 'POST',
        body: formData
      });

      const data = (await response.json()) as PublishResponse | ErrorResponse;
      if (!response.ok || !('ok' in data)) {
        const errorData = data as ErrorResponse;

        if (typeof errorData.balance === 'number') {
          setHomePointBalance(errorData.balance);
        }

        if (typeof errorData.requiredPoints === 'number') {
          openPointShortageDialog(errorData.requiredPoints, typeof errorData.balance === 'number' ? errorData.balance : homePointBalance ?? 0);
          return;
        }

        throw new Error(errorData.error ?? tx(locale, '게임을 만들지 못했어요.', 'Could not create the game.'));
      }

      setCreatedGame({
        gameId: data.gameId,
        gameUrl: data.gameUrl,
        pointsSpent: data.pointsSpent ?? 0
      });
      setPrompt('');
      if (typeof homePointBalance === 'number' && typeof data.pointsSpent === 'number') {
        setHomePointBalance(Math.max(0, homePointBalance - data.pointsSpent));
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : tx(locale, '게임을 만들지 못했어요.', 'Could not create the game.'));
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <>
      <section className="panel-card home-ai-starter" aria-labelledby="home-ai-starter-title">
        <div className="home-ai-starter-copy">
          <h1 id="home-ai-starter-title">{tx(locale, '원하는 게임 아이디어를 적어보세요', 'Write the game idea you want')}</h1>
          <p>
            {tx(
              locale,
              '캐릭터, 목표, 조작, 게임 오버 조건 정도만 적어도 괜찮아요. 여기에서 바로 AI 초안 게임을 만들 수 있어요.',
              'A character, a goal, controls, and a fail condition are enough. We can turn that into a draft game right here.'
            )}
          </p>
        </div>

        <form className="home-ai-starter-form" onSubmit={handleSubmit}>
          <label className="field-label">
            <span>{tx(locale, 'AI에게 어떤 게임을 만들지 알려주세요', 'Tell AI what game to build')}</span>
            <textarea
              value={prompt}
              onChange={(event) => {
                setPrompt(event.target.value);
                setError(null);
                setCreatedGame(null);
              }}
              rows={5}
              maxLength={1200}
              placeholder={tx(
                locale,
                '예시: 우주선을 좌우로 움직여 별을 피하고 코인을 모으는 쉬운 게임을 만들어줘. 부딪히면 게임 오버.',
                'Example: Make an easy space game where players move left and right, dodge stars, collect coins, and lose when they crash.'
              )}
            />
          </label>

          <div className="home-ai-starter-row">
            <label className="field-label home-ai-starter-model-field">
              <span>{tx(locale, 'AI 고르기', 'Pick an AI')}</span>
              <select
                value={modelId}
                onChange={(event) => {
                  setModelId(event.target.value);
                  setError(null);
                }}
                disabled={isCreating}
              >
                {models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="home-ai-starter-model-card" aria-live="polite">
              <div className="home-ai-starter-model-stat">
                <span className="small-copy">{tx(locale, '비용', 'Cost')}</span>
                <strong>{selectedModel ? `${selectedModel.pointCostCreate}P` : '-'}</strong>
              </div>
              <div className="home-ai-starter-model-stat">
                <span className="small-copy">{tx(locale, '포인트', 'Points')}</span>
                <strong className={typeof homePointBalance === 'number' ? '' : 'home-ai-starter-stat-text'}>{balanceValue}</strong>
              </div>
            </div>
          </div>

          <div className="home-ai-starter-actions">
            <button type="submit" className="button-primary" disabled={!canContinue}>
              {isCreating
                ? tx(locale, '만드는 중...', 'Creating...')
                : isLoggedIn
                  ? tx(locale, 'AI로 만들기', 'Create with AI')
                  : tx(locale, '로그인하고 AI로 만들기', 'Log in to create with AI')}
            </button>
            <a href="/submit" className="button-secondary">
              {tx(locale, '파일 올리기', 'Upload my files')}
            </a>
          </div>

          {isCreating ? <AiProgressCard title={tx(locale, 'AI가 게임을 만들고 있어요', 'AI is building your game')} detail={aiProgressCopy} step={aiProgressStep} dots={aiProgressDots} /> : null}

          {createdGame ? (
            <div className="status-card home-ai-starter-complete" role="status" aria-live="polite">
              <div className="home-ai-starter-complete-copy">
                <p className="status-title">{tx(locale, '게임 초안이 완성되었어요', 'Your draft game is ready')}</p>
                <p>
                  {tx(
                    locale,
                    '완성된 게임은 내 게임 화면에서 바로 테스트하고, 준비되면 게시할 수 있어요. 지금 이동할까요?',
                    'You can test the new draft in My Games and publish it when you are ready. Move there now?'
                  )}
                </p>
                {createdGame.pointsSpent > 0 ? (
                  <p className="small-copy">
                    {tx(locale, `이번 만들기에 ${createdGame.pointsSpent}P를 사용했어요.`, `This creation used ${createdGame.pointsSpent}P.`)}
                  </p>
                ) : null}
              </div>
              <div className="home-ai-starter-complete-actions">
                <button
                  type="button"
                  className="button-primary"
                  onClick={() => {
                    startTransition(() => {
                      router.push('/my-games?notice=created');
                    });
                  }}
                  disabled={isPending}
                >
                  {tx(locale, '내 게임으로 이동', 'Go to My Games')}
                </button>
                <button type="button" className="button-ghost" onClick={() => setCreatedGame(null)}>
                  {tx(locale, '여기서 계속 보기', 'Stay here')}
                </button>
              </div>
            </div>
          ) : null}

          {error ? <p className="error-text">{error}</p> : null}

          {!isCreating ? (
            <p className="small-copy home-ai-starter-helper">
              {createdGame
                ? tx(locale, '초안 게임이 준비되었어요. 원하면 바로 내 게임으로 이동할 수 있어요.', 'Your draft is ready. You can move to My Games whenever you want.')
                : trimmedPrompt.length >= 8
                  ? tx(locale, '좋아요. 이 화면에서 바로 초안 게임 만들기를 시작할 수 있어요.', 'Nice. You can start building a draft game right here.')
                  : tx(locale, '8자 이상 적으면 바로 만들기를 시작할 수 있어요.', 'Write at least 8 characters to start creating right away.')}
            </p>
          ) : null}
        </form>
      </section>

      <PointShortageDialog
        open={shortageDialogOpen}
        locale={locale}
        pointBalance={homePointBalance ?? 0}
        requiredPoints={shortageRequiredPoints}
        onClose={() => setShortageDialogOpen(false)}
        onPurchased={(balance) => setHomePointBalance(balance)}
      />
    </>
  );
}
