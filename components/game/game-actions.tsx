'use client';

import { useEffect, useMemo, useState } from 'react';

type GameActionsProps = {
  gameId: string;
  title: string;
  frameId: string;
  iframeId: string;
  initialLikeCount: number;
  initialDislikeCount: number;
};

type Reaction = 'LIKE' | 'DISLIKE';

type FullscreenElement = HTMLDivElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
  msRequestFullscreen?: () => Promise<void> | void;
};

export function GameActions({ gameId, title, frameId, iframeId, initialLikeCount, initialDislikeCount }: GameActionsProps) {
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [dislikeCount, setDislikeCount] = useState(initialDislikeCount);
  const [activeReaction, setActiveReaction] = useState<Reaction | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [pendingReaction, setPendingReaction] = useState<Reaction | null>(null);
  const [feedbackPending, setFeedbackPending] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState<string | null>(null);
  const canSubmitFeedback = useMemo(() => feedback.trim().length > 0 && !feedbackPending, [feedback, feedbackPending]);

  useEffect(() => {
    if (!feedbackOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [feedbackOpen]);

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

  const submitReaction = async (reaction: Reaction) => {
    if (pendingReaction) {
      return;
    }

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
      setFeedbackStatus('Reaction could not be saved.');
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
      setFeedbackStatus('Feedback sent.');
    } catch {
      setFeedbackStatus('Feedback could not be sent.');
    } finally {
      setFeedbackPending(false);
    }
  };

  const enterFullscreen = async () => {
    const frameWrap = document.getElementById(frameId) as FullscreenElement | null;
    const frame = document.getElementById(iframeId) as HTMLIFrameElement | null;
    if (!frameWrap) {
      return;
    }

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
      setFeedbackStatus('Fullscreen is blocked by this browser.');
    }
  };

  return (
    <div className="game-meta-stack">
      <div className="game-action-bar">
        <button
          type="button"
          className={`button-secondary action-pill${activeReaction === 'LIKE' ? ' is-active' : ''}`}
          onClick={() => void submitReaction('LIKE')}
          disabled={Boolean(pendingReaction)}
        >
          Like {likeCount}
        </button>
        <button
          type="button"
          className={`button-secondary action-pill${activeReaction === 'DISLIKE' ? ' is-active' : ''}`}
          onClick={() => void submitReaction('DISLIKE')}
          disabled={Boolean(pendingReaction)}
        >
          Dislike {dislikeCount}
        </button>
        <button type="button" className="button-secondary action-pill" onClick={() => setFeedbackOpen((value) => !value)}>
          Feedback
        </button>
        <button type="button" className="button-secondary action-pill" onClick={() => void enterFullscreen()}>
          Fullscreen
        </button>
      </div>
      {feedbackOpen ? (
        <div className="feedback-modal" role="dialog" aria-modal="true" aria-labelledby="feedback-title">
          <button type="button" className="feedback-backdrop" aria-label="Close feedback dialog" onClick={() => setFeedbackOpen(false)} />
          <div className="panel-card game-feedback-card feedback-modal-card">
            <h2 id="feedback-title">Feedback</h2>
            <p>Tell us what should change in {title}.</p>
            <textarea value={feedback} onChange={(event) => setFeedback(event.target.value)} placeholder="Write your feedback" />
            <div className="button-row">
              <button type="button" className="button-primary" onClick={() => void submitFeedback()} disabled={!canSubmitFeedback}>
                Send Feedback
              </button>
              <button type="button" className="button-ghost" onClick={() => setFeedbackOpen(false)} disabled={feedbackPending}>
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {feedbackStatus ? <p className="small-copy">{feedbackStatus}</p> : null}
    </div>
  );
}
