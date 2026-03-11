'use client';

import { useEffect, useMemo, useState } from 'react';
import { getDictionary, type Locale } from '@/lib/i18n';

type GameActionsProps = {
  gameId: string;
  title: string;
  initialLikeCount: number;
  initialDislikeCount: number;
  locale: Locale;
};

type GameFullscreenButtonProps = {
  frameId: string;
  iframeId: string;
  locale: Locale;
};

type Reaction = 'LIKE' | 'DISLIKE';

type FullscreenElement = HTMLDivElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
  msRequestFullscreen?: () => Promise<void> | void;
};

export function GameActions({ gameId, title, initialLikeCount, initialDislikeCount, locale }: GameActionsProps) {
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [dislikeCount, setDislikeCount] = useState(initialDislikeCount);
  const [activeReaction, setActiveReaction] = useState<Reaction | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [pendingReaction, setPendingReaction] = useState<Reaction | null>(null);
  const [feedbackPending, setFeedbackPending] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState<string | null>(null);
  const canSubmitFeedback = useMemo(() => feedback.trim().length > 0 && !feedbackPending, [feedback, feedbackPending]);
  const t = getDictionary(locale);
  const feedbackDescription =
    locale === 'ko'
      ? `${title} 게임에서 아쉬운 점이나 개선 아이디어를 알려주세요.`
      : `Tell us what could be better in ${title}.`;

  useEffect(() => {
    if (!feedbackOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setFeedbackOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [feedbackOpen]);

  const submitReaction = async (reaction: Reaction) => {
    if (pendingReaction) {
      return;
    }

    setFeedbackStatus(null);
    setPendingReaction(reaction);
    try {
      const response = await fetch(`/api/games/${gameId}/reaction`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ reaction })
      });

      const data = (await response.json().catch(() => null)) as
        | { likeCount: number; dislikeCount: number; reaction: Reaction }
        | { error?: string }
        | null;

      if (!response.ok || !data || !('reaction' in data)) {
        throw new Error('Reaction request failed.');
      }

      setLikeCount(data.likeCount);
      setDislikeCount(data.dislikeCount);
      setActiveReaction(data.reaction);
    } catch {
      setFeedbackStatus(t.game.reactionFailed);
    } finally {
      setPendingReaction(null);
    }
  };

  const submitFeedback = async () => {
    const reason = feedback.trim();
    if (!reason || feedbackPending) {
      return;
    }

    setFeedbackPending(true);
    setFeedbackStatus(null);
    try {
      const response = await fetch(`/api/games/${gameId}/feedback`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: reason })
      });

      if (!response.ok) {
        throw new Error('Feedback request failed.');
      }

      setFeedback('');
      setFeedbackOpen(false);
      setFeedbackStatus(t.game.feedbackSent);
    } catch {
      setFeedbackStatus(t.game.feedbackFailed);
    } finally {
      setFeedbackPending(false);
    }
  };

  return (
    <>
      <div className="game-description-controls">
        <button
          type="button"
          className={`button-secondary action-pill icon-action${activeReaction === 'LIKE' ? ' is-active' : ''}`}
          onClick={() => void submitReaction('LIKE')}
          disabled={Boolean(pendingReaction)}
          aria-label={t.common.likes}
        >
          <span>{t.common.likes}</span>
          <span>{likeCount}</span>
        </button>
        <button
          type="button"
          className={`button-secondary action-pill icon-action${activeReaction === 'DISLIKE' ? ' is-active' : ''}`}
          onClick={() => void submitReaction('DISLIKE')}
          disabled={Boolean(pendingReaction)}
          aria-label={t.common.dislikes}
        >
          <span>{t.common.dislikes}</span>
          <span>{dislikeCount}</span>
        </button>
        <button
          type="button"
          className="button-secondary action-pill icon-action"
          onClick={() => setFeedbackOpen((value) => !value)}
          aria-label={t.game.feedbackTitle}
        >
          <span>{t.game.feedbackTitle}</span>
        </button>
      </div>

      {feedbackOpen ? (
        <div className="feedback-drawer-layer">
          <button type="button" className="feedback-drawer-backdrop" aria-label={t.common.close} onClick={() => setFeedbackOpen(false)} />
          <div className="panel-card game-feedback-card feedback-drawer" role="dialog" aria-labelledby="feedback-title">
            <h2 id="feedback-title">{t.game.feedbackTitle}</h2>
            <p>{feedbackDescription}</p>
            <textarea value={feedback} onChange={(event) => setFeedback(event.target.value)} placeholder={t.game.feedbackPlaceholder} />
            <div className="button-row">
              <button type="button" className="button-primary" onClick={() => void submitFeedback()} disabled={!canSubmitFeedback}>
                {t.common.send}
              </button>
              <button type="button" className="button-ghost" onClick={() => setFeedbackOpen(false)} disabled={feedbackPending}>
                {t.common.close}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {feedbackStatus ? <p className="small-copy game-status-inline">{feedbackStatus}</p> : null}
    </>
  );
}

export function GameFullscreenButton({ frameId, iframeId, locale }: GameFullscreenButtonProps) {
  const [status, setStatus] = useState<string | null>(null);
  const t = getDictionary(locale);

  useEffect(() => {
    const focusFrame = () => {
      const frame = document.getElementById(iframeId) as HTMLIFrameElement | null;
      if (!frame) {
        return;
      }

      window.setTimeout(() => {
        frame.focus();
        frame.contentWindow?.focus();
      }, 50);
    };

    document.addEventListener('fullscreenchange', focusFrame);
    document.addEventListener('webkitfullscreenchange', focusFrame as EventListener);

    return () => {
      document.removeEventListener('fullscreenchange', focusFrame);
      document.removeEventListener('webkitfullscreenchange', focusFrame as EventListener);
    };
  }, [iframeId]);

  const enterFullscreen = async () => {
    const frameWrap = document.getElementById(frameId) as FullscreenElement | null;
    const frame = document.getElementById(iframeId) as HTMLIFrameElement | null;
    if (!frameWrap) {
      return;
    }

    setStatus(null);

    try {
      if (frameWrap.requestFullscreen) {
        await frameWrap.requestFullscreen({ navigationUI: 'hide' });
        frame?.focus();
        frame?.contentWindow?.focus();
        return;
      }

      if (frameWrap.webkitRequestFullscreen) {
        await frameWrap.webkitRequestFullscreen();
        frame?.focus();
        frame?.contentWindow?.focus();
        return;
      }

      if (frameWrap.msRequestFullscreen) {
        await frameWrap.msRequestFullscreen();
        frame?.focus();
        frame?.contentWindow?.focus();
      }
    } catch {
      setStatus(t.game.fullscreenFailed);
    }
  };

  return (
    <>
      <button
        type="button"
        className="game-frame-float-button"
        onClick={() => void enterFullscreen()}
        aria-label="Fullscreen"
      >
        Full
      </button>
      {status ? <p className="small-copy game-frame-status">{status}</p> : null}
    </>
  );
}
