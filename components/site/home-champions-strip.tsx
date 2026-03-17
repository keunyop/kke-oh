'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { LeaderboardChampion } from '@/lib/games/leaderboard';
import { getPlaceholderThumbnailDataUrl } from '@/lib/games/placeholder';
import { getGameAssetUrl } from '@/lib/games/urls';

type Props = {
  champions: LeaderboardChampion[];
  locale: 'ko' | 'en';
};

type DragState = {
  pointerId: number;
  startX: number;
  startScrollLeft: number;
};

const AUTO_SCROLL_PX_PER_SECOND = 28;
const AUTO_SCROLL_RESUME_DELAY_MS = 1400;

function getCopy(locale: 'ko' | 'en') {
  return locale === 'ko'
    ? {
        title: '오늘의 챔피언',
        subtitle: '점수판 맨 위에 올라간 친구들이에요.',
        score: '점수',
        by: '만든 사람'
      }
    : {
        title: 'Champion Board',
        subtitle: 'These players are sitting at the top of the score board.',
        score: 'Score',
        by: 'Maker'
      };
}

export function HomeChampionsStrip({ champions, locale }: Props) {
  const copy = getCopy(locale);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number | null>(null);
  const pauseUntilRef = useRef(0);
  const dragStateRef = useRef<DragState | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const cards = useMemo(() => (champions.length > 1 ? [...champions, ...champions] : champions), [champions]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || champions.length <= 1) {
      return;
    }

    const tick = (timestamp: number) => {
      if (lastFrameTimeRef.current == null) {
        lastFrameTimeRef.current = timestamp;
      }

      const elapsed = timestamp - lastFrameTimeRef.current;
      lastFrameTimeRef.current = timestamp;

      if (!isDragging && Date.now() >= pauseUntilRef.current) {
        const loopWidth = scroller.scrollWidth / 2;
        scroller.scrollLeft += (elapsed / 1000) * AUTO_SCROLL_PX_PER_SECOND;
        if (scroller.scrollLeft >= loopWidth) {
          scroller.scrollLeft -= loopWidth;
        }
      }

      animationFrameRef.current = window.requestAnimationFrame(tick);
    };

    animationFrameRef.current = window.requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current != null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = null;
      lastFrameTimeRef.current = null;
    };
  }, [champions.length, isDragging]);

  if (!champions.length) {
    return null;
  }

  return (
    <section className="home-champions home-champions-board" aria-labelledby="home-champions-title">
      <div className="home-champions-copy">
        <h2 id="home-champions-title">{copy.title}</h2>
        <p>{copy.subtitle}</p>
      </div>
      <div
        ref={scrollerRef}
        className={`home-champions-scroller${isDragging ? ' is-dragging' : ''}`}
        onPointerDown={(event) => {
          const scroller = scrollerRef.current;
          if (!scroller) {
            return;
          }

          dragStateRef.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startScrollLeft: scroller.scrollLeft
          };
          pauseUntilRef.current = Date.now() + AUTO_SCROLL_RESUME_DELAY_MS;
          setIsDragging(true);
          scroller.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          const scroller = scrollerRef.current;
          const dragState = dragStateRef.current;
          if (!scroller || !dragState || dragState.pointerId !== event.pointerId) {
            return;
          }

          const deltaX = event.clientX - dragState.startX;
          scroller.scrollLeft = dragState.startScrollLeft - deltaX;
        }}
        onPointerUp={(event) => {
          const scroller = scrollerRef.current;
          if (dragStateRef.current?.pointerId !== event.pointerId) {
            return;
          }

          dragStateRef.current = null;
          pauseUntilRef.current = Date.now() + AUTO_SCROLL_RESUME_DELAY_MS;
          setIsDragging(false);
          scroller?.releasePointerCapture(event.pointerId);
        }}
        onPointerCancel={(event) => {
          const scroller = scrollerRef.current;
          if (dragStateRef.current?.pointerId !== event.pointerId) {
            return;
          }

          dragStateRef.current = null;
          pauseUntilRef.current = Date.now() + AUTO_SCROLL_RESUME_DELAY_MS;
          setIsDragging(false);
          scroller?.releasePointerCapture(event.pointerId);
        }}
      >
        <div className="home-champions-track" role="list" aria-label={copy.title}>
          {cards.map((champion, index) => {
            const imageUrl = champion.thumbnailPath
              ? getGameAssetUrl(champion.gameId, champion.thumbnailPath)
              : getPlaceholderThumbnailDataUrl(champion.title);
            const isDuplicate = champions.length > 1 && index >= champions.length;

            return (
              <a
                key={`${champion.gameId}-${champion.playerName}-${index}`}
                href={`/game/${champion.slug}`}
                className="home-champion-card"
                role="listitem"
                aria-hidden={isDuplicate}
                tabIndex={isDuplicate ? -1 : undefined}
              >
                <div className="home-champion-media">
                  <Image src={imageUrl} alt={champion.title} fill className="game-card-image" unoptimized />
                </div>
                <div className="home-champion-body">
                  <h3 title={champion.title}>{champion.title}</h3>
                  <p className="home-champion-player" title={champion.playerName}>{champion.playerName}</p>
                  <p className="home-champion-score">
                    {copy.score} <strong>{champion.score.toLocaleString(locale === 'ko' ? 'ko-KR' : 'en-US')}</strong>
                  </p>
                  <p className="home-champion-maker" title={champion.uploaderName}>{copy.by} {champion.uploaderName}</p>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
