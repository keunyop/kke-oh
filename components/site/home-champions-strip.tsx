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

type PointerDragState = {
  pointerId: number;
  startX: number;
  startScrollLeft: number;
  didDrag: boolean;
};

type TouchDragState = {
  startX: number;
  startScrollLeft: number;
  didDrag: boolean;
};

const AUTO_SCROLL_PX_PER_SECOND = 28;
const AUTO_SCROLL_RESUME_DELAY_MS = 1400;
const DRAG_THRESHOLD_PX = 6;

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
  const pointerDragRef = useRef<PointerDragState | null>(null);
  const touchDragRef = useRef<TouchDragState | null>(null);
  const suppressClickRef = useRef(false);
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

  function pauseAutoScroll() {
    pauseUntilRef.current = Date.now() + AUTO_SCROLL_RESUME_DELAY_MS;
  }

  function beginPointerDrag(pointerId: number, clientX: number) {
    const scroller = scrollerRef.current;
    if (!scroller) {
      return;
    }

    suppressClickRef.current = false;
    pointerDragRef.current = {
      pointerId,
      startX: clientX,
      startScrollLeft: scroller.scrollLeft,
      didDrag: false
    };
    touchDragRef.current = null;
    pauseAutoScroll();
    setIsDragging(true);
  }

  function beginTouchDrag(clientX: number) {
    const scroller = scrollerRef.current;
    if (!scroller) {
      return;
    }

    suppressClickRef.current = false;
    touchDragRef.current = {
      startX: clientX,
      startScrollLeft: scroller.scrollLeft,
      didDrag: false
    };
    pointerDragRef.current = null;
    pauseAutoScroll();
    setIsDragging(true);
  }

  function movePointerDrag(pointerId: number, clientX: number) {
    const scroller = scrollerRef.current;
    const dragState = pointerDragRef.current;
    if (!scroller || !dragState || dragState.pointerId !== pointerId) {
      return false;
    }

    const deltaX = clientX - dragState.startX;
    scroller.scrollLeft = dragState.startScrollLeft - deltaX;
    if (Math.abs(deltaX) > DRAG_THRESHOLD_PX) {
      dragState.didDrag = true;
      suppressClickRef.current = true;
    }
    pauseAutoScroll();
    return dragState.didDrag;
  }

  function moveTouchDrag(clientX: number) {
    const scroller = scrollerRef.current;
    const dragState = touchDragRef.current;
    if (!scroller || !dragState) {
      return false;
    }

    const deltaX = clientX - dragState.startX;
    scroller.scrollLeft = dragState.startScrollLeft - deltaX;
    if (Math.abs(deltaX) > DRAG_THRESHOLD_PX) {
      dragState.didDrag = true;
      suppressClickRef.current = true;
    }
    pauseAutoScroll();
    return dragState.didDrag;
  }

  function endPointerDrag(pointerId: number) {
    const scroller = scrollerRef.current;
    const dragState = pointerDragRef.current;
    if (!dragState || dragState.pointerId !== pointerId) {
      return;
    }

    if (dragState.didDrag) {
      suppressClickRef.current = true;
    }

    pointerDragRef.current = null;
    pauseAutoScroll();
    setIsDragging(false);
    scroller?.releasePointerCapture(pointerId);
  }

  function endTouchDrag() {
    if (touchDragRef.current?.didDrag) {
      suppressClickRef.current = true;
    }

    touchDragRef.current = null;
    pauseAutoScroll();
    setIsDragging(false);
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
        onScroll={pauseAutoScroll}
        onPointerDown={(event) => {
          if (event.pointerType === 'touch') {
            return;
          }

          const scroller = scrollerRef.current;
          if (!scroller) {
            return;
          }

          beginPointerDrag(event.pointerId, event.clientX);
          scroller.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (event.pointerType === 'touch') {
            return;
          }

          if (movePointerDrag(event.pointerId, event.clientX)) {
            event.preventDefault();
          }
        }}
        onPointerUp={(event) => {
          if (event.pointerType === 'touch') {
            return;
          }

          endPointerDrag(event.pointerId);
        }}
        onPointerCancel={(event) => {
          if (event.pointerType === 'touch') {
            return;
          }

          endPointerDrag(event.pointerId);
        }}
        onTouchStart={(event) => {
          if (!event.touches.length) {
            return;
          }

          beginTouchDrag(event.touches[0].clientX);
        }}
        onTouchMove={(event) => {
          if (!event.touches.length) {
            return;
          }

          if (moveTouchDrag(event.touches[0].clientX)) {
            event.preventDefault();
          }
        }}
        onTouchEnd={() => {
          endTouchDrag();
        }}
        onTouchCancel={() => {
          endTouchDrag();
        }}
        onClickCapture={(event) => {
          if (!suppressClickRef.current) {
            return;
          }

          event.preventDefault();
          event.stopPropagation();
          suppressClickRef.current = false;
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
                draggable={false}
                role="listitem"
                aria-hidden={isDuplicate}
                tabIndex={isDuplicate ? -1 : undefined}
              >
                <div className="home-champion-media">
                  <Image src={imageUrl} alt={champion.title} fill className="game-card-image" unoptimized draggable={false} />
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
