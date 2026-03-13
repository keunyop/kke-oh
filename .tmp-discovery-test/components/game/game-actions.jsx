'use client';
import { useEffect, useMemo, useState } from 'react';
import { getDictionary } from '@/lib/i18n';
function focusIframe(iframeId) {
    if (typeof document === 'undefined') {
        return;
    }
    const frame = document.getElementById(iframeId);
    if (!frame) {
        return;
    }
    window.setTimeout(() => {
        frame.focus();
        frame.contentWindow?.focus();
    }, 50);
}
function getFullscreenDocument() {
    return document;
}
function isNativeFullscreenActive() {
    if (typeof document === 'undefined') {
        return false;
    }
    const fullscreenDocument = getFullscreenDocument();
    return Boolean(document.fullscreenElement ||
        fullscreenDocument.webkitFullscreenElement ||
        fullscreenDocument.msFullscreenElement);
}
function ReactionIcon({ type }) {
    if (type === 'LIKE') {
        return (<svg viewBox="0 0 24 24" aria-hidden="true" className="action-icon-svg">
        <path d="M9 21H6a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3m0 11V10m0 11h7.2a2 2 0 0 0 1.96-1.61l1.2-6A2 2 0 0 0 17.4 11H14V7.8A2.8 2.8 0 0 0 11.2 5L9 10" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>);
    }
    if (type === 'DISLIKE') {
        return (<svg viewBox="0 0 24 24" aria-hidden="true" className="action-icon-svg">
        <path d="M15 3h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3M15 3v11m0-11H7.8a2 2 0 0 0-1.96 1.61l-1.2 6A2 2 0 0 0 6.6 13H10v3.2A2.8 2.8 0 0 0 12.8 19L15 14" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>);
    }
    return (<svg viewBox="0 0 24 24" aria-hidden="true" className="action-icon-svg">
      <path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v6A2.5 2.5 0 0 1 16.5 15H11l-4 4v-4H7.5A2.5 2.5 0 0 1 5 12.5z" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>);
}
export function GameActions({ gameId, title, initialLikeCount, initialDislikeCount, locale }) {
    const [likeCount, setLikeCount] = useState(initialLikeCount);
    const [dislikeCount, setDislikeCount] = useState(initialDislikeCount);
    const [activeReaction, setActiveReaction] = useState(null);
    const [feedbackOpen, setFeedbackOpen] = useState(false);
    const [feedback, setFeedback] = useState('');
    const [pendingReaction, setPendingReaction] = useState(null);
    const [feedbackPending, setFeedbackPending] = useState(false);
    const [feedbackStatus, setFeedbackStatus] = useState(null);
    const canSubmitFeedback = useMemo(() => feedback.trim().length > 0 && !feedbackPending, [feedback, feedbackPending]);
    const t = getDictionary(locale);
    const feedbackDescription = locale === 'ko'
        ? `${title} 게임에서 아쉬운 점이나 개선 아이디어를 알려주세요.`
        : `Tell us what could be better in ${title}.`;
    useEffect(() => {
        if (!feedbackOpen) {
            return;
        }
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setFeedbackOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [feedbackOpen]);
    const submitReaction = async (reaction) => {
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
            const data = (await response.json().catch(() => null));
            if (!response.ok || !data || !('reaction' in data)) {
                throw new Error('Reaction request failed.');
            }
            setLikeCount(data.likeCount);
            setDislikeCount(data.dislikeCount);
            setActiveReaction(data.reaction);
        }
        catch {
            setFeedbackStatus(t.game.reactionFailed);
        }
        finally {
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
        }
        catch {
            setFeedbackStatus(t.game.feedbackFailed);
        }
        finally {
            setFeedbackPending(false);
        }
    };
    return (<>
      <div className="game-description-controls">
        <button type="button" className={`button-secondary action-pill icon-action${activeReaction === 'LIKE' ? ' is-active' : ''}`} onClick={() => void submitReaction('LIKE')} disabled={Boolean(pendingReaction)} aria-label={t.common.likes}>
          <ReactionIcon type="LIKE"/>
          <span className="sr-only">{t.common.likes}</span>
          <span>{likeCount}</span>
        </button>
        <button type="button" className={`button-secondary action-pill icon-action${activeReaction === 'DISLIKE' ? ' is-active' : ''}`} onClick={() => void submitReaction('DISLIKE')} disabled={Boolean(pendingReaction)} aria-label={t.common.dislikes}>
          <ReactionIcon type="DISLIKE"/>
          <span className="sr-only">{t.common.dislikes}</span>
          <span>{dislikeCount}</span>
        </button>
        <button type="button" className="button-secondary action-pill icon-action" onClick={() => setFeedbackOpen((value) => !value)} aria-label={t.game.feedbackTitle}>
          <ReactionIcon type="FEEDBACK"/>
          <span className="sr-only">{t.game.feedbackTitle}</span>
        </button>
      </div>

      {feedbackOpen ? (<div className="feedback-drawer-layer">
          <button type="button" className="feedback-drawer-backdrop" aria-label={t.common.close} onClick={() => setFeedbackOpen(false)}/>
          <div className="panel-card game-feedback-card feedback-drawer" role="dialog" aria-labelledby="feedback-title">
            <h2 id="feedback-title">{t.game.feedbackTitle}</h2>
            <p>{feedbackDescription}</p>
            <textarea value={feedback} onChange={(event) => setFeedback(event.target.value)} placeholder={t.game.feedbackPlaceholder}/>
            <div className="button-row">
              <button type="button" className="button-primary" onClick={() => void submitFeedback()} disabled={!canSubmitFeedback}>
                {t.common.send}
              </button>
              <button type="button" className="button-ghost" onClick={() => setFeedbackOpen(false)} disabled={feedbackPending}>
                {t.common.close}
              </button>
            </div>
          </div>
        </div>) : null}

      {feedbackStatus ? <p className="small-copy game-status-inline">{feedbackStatus}</p> : null}
    </>);
}
export function GameFullscreenButton({ frameId, iframeId, locale }) {
    const [isFallbackFullscreen, setIsFallbackFullscreen] = useState(false);
    const [isNativeFullscreen, setIsNativeFullscreen] = useState(false);
    const [status, setStatus] = useState(null);
    const t = getDictionary(locale);
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsNativeFullscreen(isNativeFullscreenActive());
            focusIframe(iframeId);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('MSFullscreenChange', handleFullscreenChange);
        handleFullscreenChange();
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
        };
    }, [iframeId]);
    useEffect(() => {
        const frameWrap = document.getElementById(frameId);
        if (!frameWrap) {
            return;
        }
        frameWrap.classList.toggle('game-frame-wrap-fallback-fullscreen', isFallbackFullscreen);
        document.body.classList.toggle('game-fullscreen-lock', isFallbackFullscreen);
        if (isFallbackFullscreen) {
            focusIframe(iframeId);
        }
        return () => {
            frameWrap.classList.remove('game-frame-wrap-fallback-fullscreen');
            document.body.classList.remove('game-fullscreen-lock');
        };
    }, [frameId, iframeId, isFallbackFullscreen]);
    useEffect(() => {
        if (!isFallbackFullscreen) {
            return;
        }
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setIsFallbackFullscreen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isFallbackFullscreen]);
    const exitFullscreen = async () => {
        setStatus(null);
        if (isFallbackFullscreen) {
            setIsFallbackFullscreen(false);
            return;
        }
        const fullscreenDocument = getFullscreenDocument();
        try {
            if (document.exitFullscreen && document.fullscreenElement) {
                await document.exitFullscreen();
                return;
            }
            if (fullscreenDocument.webkitExitFullscreen && fullscreenDocument.webkitFullscreenElement) {
                await fullscreenDocument.webkitExitFullscreen();
                return;
            }
            if (fullscreenDocument.msExitFullscreen && fullscreenDocument.msFullscreenElement) {
                await fullscreenDocument.msExitFullscreen();
            }
        }
        catch {
            setStatus(t.game.fullscreenFailed);
        }
    };
    const enterFullscreen = async () => {
        const frameWrap = document.getElementById(frameId);
        if (!frameWrap) {
            return;
        }
        setStatus(null);
        try {
            if (frameWrap.requestFullscreen) {
                await frameWrap.requestFullscreen({ navigationUI: 'hide' });
                focusIframe(iframeId);
                return;
            }
            if (frameWrap.webkitRequestFullscreen) {
                await frameWrap.webkitRequestFullscreen();
                focusIframe(iframeId);
                return;
            }
            if (frameWrap.msRequestFullscreen) {
                await frameWrap.msRequestFullscreen();
                focusIframe(iframeId);
                return;
            }
        }
        catch {
            setIsFallbackFullscreen(true);
            return;
        }
        setIsFallbackFullscreen(true);
    };
    return (<>
      <button type="button" className="game-frame-float-button" onClick={() => void (isNativeFullscreen || isFallbackFullscreen ? exitFullscreen() : enterFullscreen())} aria-label={isNativeFullscreen || isFallbackFullscreen ? t.common.close : 'Fullscreen'}>
        <span aria-hidden="true">{isNativeFullscreen || isFallbackFullscreen ? '\u2715' : '\u26F6'}</span>
      </button>
      {status ? <p className="small-copy game-frame-status">{status}</p> : null}
    </>);
}
