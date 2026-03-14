'use client';

import { useEffect } from 'react';

type GameFullscreenShellProps = {
  frameId: string;
};

type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  msFullscreenElement?: Element | null;
};

function isNativeFullscreenActive() {
  const fullscreenDocument = document as FullscreenDocument;
  return Boolean(
    document.fullscreenElement ||
      fullscreenDocument.webkitFullscreenElement ||
      fullscreenDocument.msFullscreenElement
  );
}

export function GameFullscreenShell({ frameId }: GameFullscreenShellProps) {
  useEffect(() => {
    const frameWrap = document.getElementById(frameId);
    if (!frameWrap) {
      return;
    }

    const syncFullscreenState = () => {
      const isFallbackFullscreen = frameWrap.classList.contains('game-frame-wrap-fallback-fullscreen');
      const isFullscreenActive = isFallbackFullscreen || isNativeFullscreenActive();

      document.body.classList.toggle('game-fullscreen-lock', isFullscreenActive);
      document.body.classList.toggle('game-fullscreen-active', isFullscreenActive);
    };

    const observer = new MutationObserver(syncFullscreenState);
    observer.observe(frameWrap, { attributes: true, attributeFilter: ['class'] });

    document.addEventListener('fullscreenchange', syncFullscreenState);
    document.addEventListener('webkitfullscreenchange', syncFullscreenState as EventListener);
    document.addEventListener('MSFullscreenChange', syncFullscreenState as EventListener);
    syncFullscreenState();

    return () => {
      observer.disconnect();
      document.removeEventListener('fullscreenchange', syncFullscreenState);
      document.removeEventListener('webkitfullscreenchange', syncFullscreenState as EventListener);
      document.removeEventListener('MSFullscreenChange', syncFullscreenState as EventListener);
      document.body.classList.remove('game-fullscreen-lock');
      document.body.classList.remove('game-fullscreen-active');
    };
  }, [frameId]);

  return null;
}
