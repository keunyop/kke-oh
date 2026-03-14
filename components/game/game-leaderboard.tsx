'use client';

import { useEffect, useRef, useState } from 'react';
import type { LeaderboardEntry } from '@/lib/games/leaderboard';
import type { Locale } from '@/lib/i18n';

type Props = {
  gameId: string;
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

function getCopy(locale: Locale) {
  return locale === 'ko'
    ? {
        title: '리더보드',
        subtitle: '이 게임의 최고 점수를 모아 보여줘요.',
        draftNote: '초안 테스트 중에도 점수를 저장해서 미리 확인할 수 있어요.',
        empty: '아직 등록된 점수가 없어요. 첫 1등이 되어보세요.',
        saving: '점수를 저장하고 있어요...',
        saved: '점수가 리더보드에 등록되었어요.',
        failed: '점수를 저장하지 못했어요.',
        rank: '순위',
        player: '플레이어',
        score: '점수',
        namePrompt: '리더보드에 표시할 이름을 적어주세요.',
        defaultName: '플레이어',
        waiting: '게임에서 점수가 올라오면 여기에 바로 반영돼요.'
      }
    : {
        title: 'Leaderboard',
        subtitle: 'Top scores for this game.',
        draftNote: 'You can save scores here while testing the draft privately.',
        empty: 'No scores yet. Be the first champion.',
        saving: 'Saving score...',
        saved: 'Score saved to the leaderboard.',
        failed: 'Could not save the score.',
        rank: 'Rank',
        player: 'Player',
        score: 'Score',
        namePrompt: 'Choose the name to show on the leaderboard.',
        defaultName: 'Player',
        waiting: 'Scores from the game will appear here automatically.'
      };
}

function normalizeClientPlayerName(value: string, fallback: string) {
  const trimmed = value.replace(/\s+/g, ' ').trim();
  return trimmed ? trimmed.slice(0, 24) : fallback;
}

export function GameLeaderboard({ gameId, locale, initialEntries, allowSubmission, isDraftPreview }: Props) {
  const copy = getCopy(locale);
  const [entries, setEntries] = useState(initialEntries);
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const lastSubmittedRef = useRef<{ score: number; at: number } | null>(null);

  useEffect(() => {
    setEntries(initialEntries);
  }, [initialEntries]);

  useEffect(() => {
    if (!allowSubmission) {
      return;
    }

    const handler = (event: MessageEvent) => {
      void (async () => {
        if (event.origin !== window.location.origin || !event.data || typeof event.data !== 'object') {
          return;
        }

        const payload = event.data as { type?: unknown; score?: unknown };
        if (payload.type !== 'kkeoh:submit-score') {
          return;
        }

        const score = Number(payload.score);
        if (!Number.isFinite(score) || score < 1) {
          return;
        }

        const normalizedScore = Math.round(score);
        const previous = lastSubmittedRef.current;
        const now = Date.now();
        if (previous && previous.score === normalizedScore && now - previous.at < 1500) {
          return;
        }

        lastSubmittedRef.current = { score: normalizedScore, at: now };
        setPending(true);
        setStatus(copy.saving);

        try {
          const storedName = window.localStorage.getItem(PLAYER_NAME_STORAGE_KEY);
          const nextName = normalizeClientPlayerName(
            storedName ?? window.prompt(copy.namePrompt, copy.defaultName) ?? '',
            copy.defaultName
          );
          window.localStorage.setItem(PLAYER_NAME_STORAGE_KEY, nextName);

          const response = await fetch(`/api/games/${gameId}/leaderboard`, {
            method: 'POST',
            headers: {
              'content-type': 'application/json'
            },
            body: JSON.stringify({
              playerName: nextName,
              score: normalizedScore
            })
          });

          const data = (await response.json()) as LeaderboardResponse;
          if (!response.ok || !data.entries) {
            throw new Error(data.error ?? copy.failed);
          }

          setEntries(data.entries);
          setStatus(copy.saved);
        } catch (error) {
          setStatus(error instanceof Error ? error.message : copy.failed);
        } finally {
          setPending(false);
        }
      })();
    };

    window.addEventListener('message', handler);
    return () => {
      window.removeEventListener('message', handler);
    };
  }, [allowSubmission, copy.defaultName, copy.failed, copy.namePrompt, copy.saved, copy.saving, gameId]);

  return (
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
  );
}
