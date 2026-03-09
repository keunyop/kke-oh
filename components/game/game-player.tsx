'use client';

import { useEffect, useRef, useState } from 'react';

type FullscreenElement = HTMLDivElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
  msRequestFullscreen?: () => Promise<void> | void;
};

type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  msFullscreenElement?: Element | null;
};

type GamePlayerProps = {
  gameId: string;
  src: string;
  title: string;
};

export function GamePlayer({ gameId, src, title }: GamePlayerProps) {
  const [started, setStarted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenSupported, setFullscreenSupported] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = frameRef.current as FullscreenElement | null;
    setFullscreenSupported(Boolean(element?.requestFullscreen || element?.webkitRequestFullscreen || element?.msRequestFullscreen));

    const syncFullscreenState = () => {
      const fullscreenDocument = document as FullscreenDocument;
      const activeElement =
        document.fullscreenElement ??
        fullscreenDocument.webkitFullscreenElement ??
        fullscreenDocument.msFullscreenElement ??
        null;

      setIsFullscreen(activeElement === frameRef.current);
    };

    syncFullscreenState();
    document.addEventListener('fullscreenchange', syncFullscreenState);
    document.addEventListener('webkitfullscreenchange', syncFullscreenState as EventListener);
    document.addEventListener('msfullscreenchange', syncFullscreenState as EventListener);

    return () => {
      document.removeEventListener('fullscreenchange', syncFullscreenState);
      document.removeEventListener('webkitfullscreenchange', syncFullscreenState as EventListener);
      document.removeEventListener('msfullscreenchange', syncFullscreenState as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!started) {
      return;
    }

    fetch(`/api/games/${gameId}/play`, { method: 'POST' }).catch(() => undefined);
  }, [gameId, started]);

  const requestFullscreen = async () => {
    const element = frameRef.current as FullscreenElement | null;
    if (!element) {
      return;
    }

    try {
      if (element.requestFullscreen) {
        await element.requestFullscreen({ navigationUI: 'hide' });
        return;
      }

      if (element.webkitRequestFullscreen) {
        await element.webkitRequestFullscreen();
        return;
      }

      if (element.msRequestFullscreen) {
        await element.msRequestFullscreen();
      }
    } catch {
      // Fullscreen may be blocked by the browser even with a user gesture.
    }
  };

  const handleStart = async () => {
    setStarted(true);
    await requestFullscreen();
  };

  const handleEnterFullscreen = async () => {
    await requestFullscreen();
  };

  return (
    <div ref={frameRef} className={`game-player-shell${isFullscreen ? ' is-fullscreen' : ''}`}>
      {!started ? (
        <div className="game-start-panel">
          <p className="game-start-kicker">Ready to play</p>
          <h2>{title}</h2>
          <p>Start the game and switch to fullscreen right away for a better mobile view.</p>
          <button type="button" className="button-primary" onClick={handleStart}>
            Start Game
          </button>
        </div>
      ) : (
        <>
          <iframe
            src={src}
            sandbox="allow-scripts allow-same-origin allow-pointer-lock"
            referrerPolicy="no-referrer"
            allow="fullscreen"
            title={title}
          />
          {fullscreenSupported && !isFullscreen ? (
            <button type="button" className="game-fullscreen-button" onClick={handleEnterFullscreen}>
              Fullscreen
            </button>
          ) : null}
        </>
      )}
    </div>
  );
}
