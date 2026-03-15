'use client';

import { useEffect, useRef, useState } from 'react';
import {
  extractBestLeaderboardScoreFromText,
  extractLeaderboardSubmissionScore,
  hasLeaderboardTerminalState,
  normalizeLeaderboardSubmissionScore
} from '@/lib/games/score-bridge';
import type { LeaderboardEntry } from '@/lib/games/leaderboard';
import type { Locale } from '@/lib/i18n';

type Props = {
  gameId: string;
  iframeId?: string;
  currentUserLoginId?: string | null;
  locale: Locale;
  initialEntries: LeaderboardEntry[];
  allowSubmission: boolean;
  isDraftPreview: boolean;
};

type LeaderboardResponse = {
  entries?: LeaderboardEntry[];
  error?: string;
};

const PLAYER_NAME_STORAGE_KEY = 'kkeoh:leaderboard-player-name';
const REPLAY_TRIGGER_REGEX = /\b(restart|retry|play again|try again)\b|다시\s*하기|재도전|retry/iu;

function getCopy(locale: Locale) {
  return locale === 'ko'
    ? {
        title: '리더보드',
        subtitle: '이 게임의 최고 점수를 모아 보여줘요.',
        draftNote: '초안 테스트 중에도 점수를 저장해서 미리 확인할 수 있어요.',
        empty: '아직 등록된 점수가 없어요. 첫 챔피언이 되어보세요.',
        saving: '점수를 저장하고 있어요.',
        saved: '점수가 리더보드에 등록되었어요.',
        failed: '점수를 저장하지 못했어요.',
        rank: '순위',
        player: '플레이어',
        score: '점수',
        waiting: '게임에서 점수가 올라가면 여기에 바로 반영돼요.',
        guestTitle: '이름을 입력해주세요',
        guestDescription: '로그인하지 않은 상태라 리더보드에 표시할 이름이 필요해요.',
        guestPlaceholder: '플레이어 이름',
        guestConfirm: '점수 등록',
        guestCancel: '닫기',
        guestRequired: '이름을 입력해주세요.'
      }
    : {
        title: 'Leaderboard',
        subtitle: 'Top scores for this game.',
        draftNote: 'You can save scores here while testing the draft privately.',
        empty: 'No scores yet. Be the first champion.',
        saving: 'Saving score.',
        saved: 'Score saved to the leaderboard.',
        failed: 'Could not save the score.',
        rank: 'Rank',
        player: 'Player',
        score: 'Score',
        waiting: 'Scores from the game will appear here automatically.',
        guestTitle: 'Enter your name',
        guestDescription: 'You are not logged in, so we need a name to show on the leaderboard.',
        guestPlaceholder: 'Player name',
        guestConfirm: 'Save score',
        guestCancel: 'Cancel',
        guestRequired: 'Please enter your name.'
      };
}

function normalizeClientPlayerName(value: string, fallback: string) {
  const trimmed = value.replace(/\s+/g, ' ').trim();
  return trimmed ? trimmed.slice(0, 24) : fallback;
}

export function GameLeaderboard({
  gameId,
  iframeId,
  currentUserLoginId,
  locale,
  initialEntries,
  allowSubmission,
  isDraftPreview
}: Props) {
  const copy = getCopy(locale);
  const [entries, setEntries] = useState(initialEntries);
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestScorePending, setGuestScorePending] = useState<number | null>(null);
  const [guestDialogOpen, setGuestDialogOpen] = useState(false);
  const lastSubmittedRef = useRef<{ score: number; at: number } | null>(null);
  const lastObservedScoreRef = useRef<number | null>(null);
  const lastObservedSubmissionRef = useRef<number | null>(null);
  const requestedScoresRef = useRef<Set<number>>(new Set());
  const commitScoreRef = useRef<(score: number, playerName: string) => Promise<boolean>>(async () => false);
  const requestScoreRef = useRef<(score: number) => Promise<void>>(async () => {});

  useEffect(() => {
    setEntries(initialEntries);
  }, [initialEntries]);

  useEffect(() => {
    commitScoreRef.current = async (score: number, playerName: string) => {
      const normalizedScore = normalizeLeaderboardSubmissionScore(score);
      if (normalizedScore == null) {
        return false;
      }

      const previous = lastSubmittedRef.current;
      const now = Date.now();
      if (previous && previous.score === normalizedScore && now - previous.at < 1500) {
        return true;
      }

      lastSubmittedRef.current = { score: normalizedScore, at: now };
      setPending(true);
      setStatus(copy.saving);

      try {
        const normalizedName = normalizeClientPlayerName(playerName, copy.player);
        const response = await fetch(`/api/games/${gameId}/leaderboard`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            playerName: normalizedName,
            score: normalizedScore
          })
        });

        const data = (await response.json()) as LeaderboardResponse;
        if (!response.ok || !data.entries) {
          throw new Error(data.error ?? copy.failed);
        }

        setEntries(data.entries);
        setStatus(copy.saved);
        return true;
      } catch (error) {
        setStatus(error instanceof Error ? error.message : copy.failed);
        return false;
      } finally {
        setPending(false);
      }
    };
  }, [copy.failed, copy.player, copy.saved, copy.saving, gameId]);

  useEffect(() => {
    requestScoreRef.current = async (score: number) => {
      const normalizedScore = normalizeLeaderboardSubmissionScore(score);
      if (normalizedScore == null) {
        return;
      }

      if (requestedScoresRef.current.has(normalizedScore)) {
        return;
      }

      if (currentUserLoginId?.trim()) {
        requestedScoresRef.current.add(normalizedScore);
        const saved = await commitScoreRef.current(normalizedScore, currentUserLoginId);
        if (!saved) {
          requestedScoresRef.current.delete(normalizedScore);
        }
        return;
      }

      const storedName =
        typeof window === 'undefined' ? null : normalizeClientPlayerName(window.localStorage.getItem(PLAYER_NAME_STORAGE_KEY) ?? '', '');

      if (storedName) {
        requestedScoresRef.current.add(normalizedScore);
        const saved = await commitScoreRef.current(normalizedScore, storedName);
        if (!saved) {
          requestedScoresRef.current.delete(normalizedScore);
        }
        return;
      }

      requestedScoresRef.current.add(normalizedScore);
      setGuestName('');
      setGuestScorePending(normalizedScore);
      setGuestDialogOpen(true);
    };
  }, [currentUserLoginId]);

  useEffect(() => {
    if (!allowSubmission) {
      return;
    }

    const handler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return;
      }

      const score = extractLeaderboardSubmissionScore(event.data);
      if (score == null) {
        return;
      }

      void requestScoreRef.current(score);
    };

    window.addEventListener('message', handler);
    return () => {
      window.removeEventListener('message', handler);
    };
  }, [allowSubmission]);

  useEffect(() => {
    if (!allowSubmission || !iframeId) {
      return;
    }

    const iframe = document.getElementById(iframeId);
    if (!(iframe instanceof HTMLIFrameElement)) {
      return;
    }

    let observer: MutationObserver | null = null;
    let pollTimer: number | null = null;
    let clickCleanup: (() => void) | null = null;

    const evaluateIframeDocument = (forceSubmit = false) => {
      try {
        const frameDocument = iframe.contentDocument;
        const bodyText = frameDocument?.body?.innerText?.slice(0, 40000) ?? '';
        if (!bodyText) {
          return;
        }

        const bestScore = extractBestLeaderboardScoreFromText(bodyText);
        if (bestScore != null) {
          lastObservedScoreRef.current =
            lastObservedScoreRef.current == null ? bestScore : Math.max(lastObservedScoreRef.current, bestScore);
        }

        const candidateScore = lastObservedScoreRef.current;
        if (candidateScore == null) {
          return;
        }

        const shouldSubmit = forceSubmit || hasLeaderboardTerminalState(bodyText);
        if (!shouldSubmit) {
          return;
        }

        const previousObserved = lastObservedSubmissionRef.current;
        if (previousObserved === candidateScore || requestedScoresRef.current.has(candidateScore)) {
          return;
        }

        lastObservedSubmissionRef.current = candidateScore;
        void requestScoreRef.current(candidateScore);
      } catch {
        // Ignore same-origin race conditions while the iframe is loading.
      }
    };

    const installBridge = () => {
      try {
        const frameWindow = iframe.contentWindow as (Window & typeof globalThis & {
          kkeohSubmitScore?: (score: unknown) => boolean;
        }) | null;

        if (!frameWindow) {
          return;
        }

        frameWindow.kkeohSubmitScore = (score: unknown) => {
          const normalizedScore = normalizeLeaderboardSubmissionScore(score);
          if (normalizedScore == null) {
            return false;
          }

          void requestScoreRef.current(normalizedScore);
          return true;
        };
      } catch {
        // Ignore bridge installation failures while the frame is still loading.
      }
    };

    const installObserver = () => {
      try {
        const frameDocument = iframe.contentDocument;
        if (!frameDocument?.body) {
          return;
        }

        observer?.disconnect();
        if (pollTimer != null) {
          window.clearInterval(pollTimer);
        }
        clickCleanup?.();

        observer = new MutationObserver(() => {
          evaluateIframeDocument(false);
        });
        observer.observe(frameDocument.body, {
          childList: true,
          subtree: true,
          characterData: true
        });

        const clickHandler = (event: Event) => {
          const target = event.target;
          if (!(target instanceof Element)) {
            return;
          }

          const label = target.textContent?.trim() ?? '';
          if (REPLAY_TRIGGER_REGEX.test(label)) {
            evaluateIframeDocument(true);
          }
        };

        frameDocument.addEventListener('click', clickHandler, true);
        clickCleanup = () => frameDocument.removeEventListener('click', clickHandler, true);
        pollTimer = window.setInterval(() => evaluateIframeDocument(false), 1600);
        evaluateIframeDocument(false);
      } catch {
        // Ignore same-origin race conditions while the iframe is loading.
      }
    };

    const resetSession = () => {
      lastSubmittedRef.current = null;
      lastObservedScoreRef.current = null;
      lastObservedSubmissionRef.current = null;
      requestedScoresRef.current.clear();
    };

    const installAll = () => {
      installBridge();
      installObserver();
    };

    const handleLoad = () => {
      resetSession();
      installAll();
    };

    resetSession();
    installAll();
    iframe.addEventListener('load', handleLoad);
    const retryA = window.setTimeout(installAll, 250);
    const retryB = window.setTimeout(installAll, 1200);

    return () => {
      window.clearTimeout(retryA);
      window.clearTimeout(retryB);
      iframe.removeEventListener('load', handleLoad);
      observer?.disconnect();
      if (pollTimer != null) {
        window.clearInterval(pollTimer);
      }
      clickCleanup?.();
    };
  }, [allowSubmission, iframeId]);

  async function submitGuestScore() {
    if (guestScorePending == null) {
      setGuestDialogOpen(false);
      return;
    }

    const normalizedName = normalizeClientPlayerName(guestName, '');
    if (!normalizedName) {
      setStatus(copy.guestRequired);
      return;
    }

    window.localStorage.setItem(PLAYER_NAME_STORAGE_KEY, normalizedName);
    setGuestDialogOpen(false);
    setGuestScorePending(null);
    setGuestName('');

    const saved = await commitScoreRef.current(guestScorePending, normalizedName);
    if (!saved) {
      requestedScoresRef.current.delete(guestScorePending);
    }
  }

  return (
    <>
      <section className="panel-card leaderboard-card">
        <div className="leaderboard-card-head">
          <div>
            <h2>{copy.title}</h2>
            <p>{isDraftPreview ? copy.draftNote : copy.subtitle}</p>
          </div>
          <p className="small-copy leaderboard-card-waiting">{copy.waiting}</p>
        </div>

        {entries.length ? (
          <div className="leaderboard-table" role="table" aria-label={copy.title}>
            <div className="leaderboard-row leaderboard-row-head" role="row">
              <span role="columnheader">{copy.rank}</span>
              <span role="columnheader">{copy.player}</span>
              <span role="columnheader">{copy.score}</span>
            </div>
            {entries.map((entry, index) => (
              <div key={`${entry.playerName}-${entry.score}-${entry.createdAt}`} className="leaderboard-row" role="row">
                <span role="cell">#{index + 1}</span>
                <strong role="cell">{entry.playerName}</strong>
                <span role="cell">{entry.score.toLocaleString(locale === 'ko' ? 'ko-KR' : 'en-US')}</span>
              </div>
            ))}
          </div>
        ) : (
          <p>{copy.empty}</p>
        )}

        {status ? <p className={`small-copy${pending ? '' : ' leaderboard-status'}`}>{status}</p> : null}
      </section>

      {guestDialogOpen ? (
        <div className="dialog-backdrop" role="presentation">
          <form
            className="panel-card dialog-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="leaderboard-guest-title"
            onSubmit={(event) => {
              event.preventDefault();
              void submitGuestScore();
            }}
          >
            <div>
              <h2 id="leaderboard-guest-title">{copy.guestTitle}</h2>
              <p>{copy.guestDescription}</p>
            </div>
            <label className="field-label">
              <span>{copy.player}</span>
              <input
                value={guestName}
                onChange={(event) => setGuestName(event.target.value)}
                maxLength={24}
                placeholder={copy.guestPlaceholder}
                autoFocus
              />
            </label>
            <div className="dialog-actions">
              <button
                type="button"
                className="button-ghost"
                onClick={() => {
                  if (guestScorePending != null) {
                    requestedScoresRef.current.delete(guestScorePending);
                  }
                  setGuestDialogOpen(false);
                  setGuestScorePending(null);
                  setGuestName('');
                }}
              >
                {copy.guestCancel}
              </button>
              <button type="submit" className="button-primary">
                {copy.guestConfirm}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
