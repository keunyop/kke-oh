'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { getDictionary, type Locale } from '@/lib/i18n';

type Reaction = 'LIKE' | 'DISLIKE';

type GameActionsProps = {
  gameId: string;
  title: string;
  initialLikeCount: number;
  initialDislikeCount: number;
  initialReaction?: Reaction | null;
  locale: Locale;
};

type GameFullscreenButtonProps = {
  frameId: string;
  iframeId: string;
  locale: Locale;
};

type FullscreenElement = HTMLDivElement & {
  webkitRequestFullscreen?: (options?: FullscreenOptions) => Promise<void> | void;
  msRequestFullscreen?: () => Promise<void> | void;
};

type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
  msFullscreenElement?: Element | null;
  msExitFullscreen?: () => Promise<void> | void;
};

function focusIframe(iframeId: string) {
  if (typeof document === 'undefined') return;
  const frame = document.getElementById(iframeId) as HTMLIFrameElement | null;
  if (!frame) return;

  window.setTimeout(() => {
    frame.focus();
    frame.contentWindow?.focus();
  }, 50);
}

function getFullscreenDocument() {
  return document as FullscreenDocument;
}

function isNativeFullscreenActive() {
  if (typeof document === 'undefined') return false;
  const fullscreenDocument = getFullscreenDocument();
  return Boolean(document.fullscreenElement || fullscreenDocument.webkitFullscreenElement || fullscreenDocument.msFullscreenElement);
}

function ActionIcon({ type }: { type: 'LIKE' | 'DISLIKE' | 'FEEDBACK' | 'REPORT' | 'SHARE' }) {
  if (type === 'LIKE') {
    return <svg viewBox="0 0 24 24" aria-hidden="true" className="action-icon-svg"><path d="M9 21H6a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3m0 11V10m0 11h7.2a2 2 0 0 0 1.96-1.61l1.2-6A2 2 0 0 0 17.4 11H14V7.8A2.8 2.8 0 0 0 11.2 5L9 10" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  }

  if (type === 'DISLIKE') {
    return <svg viewBox="0 0 24 24" aria-hidden="true" className="action-icon-svg"><path d="M15 3h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3M15 3v11m0-11H7.8a2 2 0 0 0-1.96 1.61l-1.2 6A2 2 0 0 0 6.6 13H10v3.2A2.8 2.8 0 0 0 12.8 19L15 14" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  }

  if (type === 'REPORT') {
    return <svg viewBox="0 0 24 24" aria-hidden="true" className="action-icon-svg"><path d="M6 4.5h9.2l-1.3 3.4 1.3 3.4H6v8" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  }

  if (type === 'SHARE') {
    return <svg viewBox="0 0 24 24" aria-hidden="true" className="action-icon-svg"><path d="M14 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /><path d="M19 10H9a4 4 0 0 0-4 4v5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  }

  return <svg viewBox="0 0 24 24" aria-hidden="true" className="action-icon-svg"><path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v6A2.5 2.5 0 0 1 16.5 15H11l-4 4v-4H7.5A2.5 2.5 0 0 1 5 12.5z" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function ActionButton({
  label,
  active = false,
  disabled = false,
  onClick,
  children
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={`button-secondary action-pill icon-action action-tooltip-trigger${active ? ' is-active' : ''}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      data-tooltip={label}
    >
      {children}
    </button>
  );
}

export function GameActionsClient({ gameId, title, initialLikeCount, initialDislikeCount, initialReaction = null, locale }: GameActionsProps) {
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [dislikeCount, setDislikeCount] = useState(initialDislikeCount);
  const [activeReaction, setActiveReaction] = useState<Reaction | null>(initialReaction);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [reportReason, setReportReason] = useState('');
  const [pendingReaction, setPendingReaction] = useState<Reaction | null>(null);
  const [feedbackPending, setFeedbackPending] = useState(false);
  const [reportPending, setReportPending] = useState(false);
  const [sharePending, setSharePending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const canSubmitFeedback = useMemo(() => feedback.trim().length > 0 && !feedbackPending, [feedback, feedbackPending]);
  const t = getDictionary(locale);
  const feedbackDescription = locale === 'ko' ? `${title} 게임을 더 재미있게 만드는 아이디어를 알려주세요.` : `Tell us how to make ${title} even more fun.`;
  const reportTitle = locale === 'ko' ? '신고' : 'Report';
  const shareTitle = locale === 'ko' ? '공유' : 'Share';
  const shareDone = locale === 'ko' ? '게임 링크를 복사했어요.' : 'Game link copied.';
  const shareFailed = locale === 'ko' ? '게임 링크를 공유하지 못했어요.' : 'Could not share the game link.';
  const reportDescription = locale === 'ko' ? `${title} 게임에서 확인이 필요한 점을 알려주세요.` : `Tell us what should be checked in ${title}.`;
  const reportPlaceholder = locale === 'ko' ? '신고 사유를 적어주세요.' : 'Tell us why this game should be reviewed.';
  const reportSent = locale === 'ko' ? '신고가 접수되었어요.' : 'The report was submitted.';
  const reportFailed = locale === 'ko' ? '신고를 보내지 못했어요.' : 'Could not submit the report.';
  const reportActionLabel = locale === 'ko' ? '신고 보내기' : 'Send report';

  useEffect(() => {
    if (!feedbackOpen && !reportOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setFeedbackOpen(false);
        setReportOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [feedbackOpen, reportOpen]);

  const submitReaction = async (reaction: Reaction) => {
    if (pendingReaction) return;

    setStatus(null);
    setPendingReaction(reaction);
    try {
      const response = await fetch(`/api/games/${gameId}/reaction`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ reaction })
      });
      const data = (await response.json().catch(() => null)) as { likeCount: number; dislikeCount: number; reaction: Reaction } | { error?: string } | null;
      if (!response.ok || !data || !('reaction' in data)) {
        throw new Error('Reaction request failed.');
      }

      setLikeCount(data.likeCount);
      setDislikeCount(data.dislikeCount);
      setActiveReaction(data.reaction);
    } catch {
      setStatus(t.game.reactionFailed);
    } finally {
      setPendingReaction(null);
    }
  };

  const submitFeedback = async () => {
    const message = feedback.trim();
    if (!message || feedbackPending) return;

    setFeedbackPending(true);
    setStatus(null);
    try {
      const response = await fetch(`/api/games/${gameId}/feedback`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message })
      });
      if (!response.ok) {
        throw new Error('Feedback request failed.');
      }

      setFeedback('');
      setFeedbackOpen(false);
      setStatus(t.game.feedbackSent);
    } catch {
      setStatus(t.game.feedbackFailed);
    } finally {
      setFeedbackPending(false);
    }
  };

  const submitReport = async () => {
    const reason = reportReason.trim();
    if (!reason || reportPending) return;

    setReportPending(true);
    setStatus(null);
    try {
      const response = await fetch(`/api/games/${gameId}/report`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      if (!response.ok) {
        throw new Error('Report request failed.');
      }

      setReportReason('');
      setReportOpen(false);
      setStatus(reportSent);
    } catch {
      setStatus(reportFailed);
    } finally {
      setReportPending(false);
    }
  };

  const shareGame = async () => {
    if (sharePending || typeof window === 'undefined') {
      return;
    }

    setSharePending(true);
    setStatus(null);

    try {
      const shareUrl = window.location.href;
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const input = document.createElement('input');
        input.value = shareUrl;
        input.setAttribute('readonly', '');
        input.style.position = 'absolute';
        input.style.left = '-9999px';
        document.body.appendChild(input);
        input.select();
        const copied = document.execCommand('copy');
        document.body.removeChild(input);

        if (!copied) {
          throw new Error('Share unavailable');
        }
      }

      setStatus(shareDone);
    } catch {
      setStatus(shareFailed);
    } finally {
      setSharePending(false);
    }
  };

  return (
    <>
      <div className="game-description-controls">
        <ActionButton label={t.common.likes} active={activeReaction === 'LIKE'} disabled={Boolean(pendingReaction)} onClick={() => void submitReaction('LIKE')}>
          <ActionIcon type="LIKE" />
          <span className="sr-only">{t.common.likes}</span>
          <span>{likeCount}</span>
        </ActionButton>
        <ActionButton label={t.common.dislikes} active={activeReaction === 'DISLIKE'} disabled={Boolean(pendingReaction)} onClick={() => void submitReaction('DISLIKE')}>
          <ActionIcon type="DISLIKE" />
          <span className="sr-only">{t.common.dislikes}</span>
          <span>{dislikeCount}</span>
        </ActionButton>
        <ActionButton label={t.game.feedbackTitle} onClick={() => setFeedbackOpen((value) => !value)}>
          <ActionIcon type="FEEDBACK" />
          <span className="sr-only">{t.game.feedbackTitle}</span>
        </ActionButton>
        <ActionButton label={shareTitle} disabled={sharePending} onClick={() => void shareGame()}>
          <ActionIcon type="SHARE" />
          <span className="sr-only">{shareTitle}</span>
        </ActionButton>
        <ActionButton label={reportTitle} onClick={() => setReportOpen((value) => !value)}>
          <ActionIcon type="REPORT" />
          <span className="sr-only">{reportTitle}</span>
        </ActionButton>
      </div>

      {feedbackOpen ? <div className="feedback-drawer-layer"><button type="button" className="feedback-drawer-backdrop" aria-label={t.common.close} onClick={() => setFeedbackOpen(false)} /><div className="panel-card game-feedback-card feedback-drawer" role="dialog" aria-labelledby="feedback-title"><h2 id="feedback-title">{t.game.feedbackTitle}</h2><p>{feedbackDescription}</p><textarea value={feedback} onChange={(event) => setFeedback(event.target.value)} placeholder={t.game.feedbackPlaceholder} /><div className="button-row"><button type="button" className="button-primary" onClick={() => void submitFeedback()} disabled={!canSubmitFeedback}>{t.common.send}</button><button type="button" className="button-ghost" onClick={() => setFeedbackOpen(false)} disabled={feedbackPending}>{t.common.close}</button></div></div></div> : null}

      {reportOpen ? <div className="feedback-drawer-layer"><button type="button" className="feedback-drawer-backdrop" aria-label={t.common.close} onClick={() => setReportOpen(false)} /><div className="panel-card game-feedback-card feedback-drawer" role="dialog" aria-labelledby="report-title"><h2 id="report-title">{reportTitle}</h2><p>{reportDescription}</p><textarea value={reportReason} onChange={(event) => setReportReason(event.target.value)} placeholder={reportPlaceholder} /><div className="button-row"><button type="button" className="button-primary" onClick={() => void submitReport()} disabled={!reportReason.trim() || reportPending}>{reportActionLabel}</button><button type="button" className="button-ghost" onClick={() => setReportOpen(false)} disabled={reportPending}>{t.common.close}</button></div></div></div> : null}

      {status ? <p className="small-copy game-status-inline">{status}</p> : null}
    </>
  );
}

export function GameFullscreenButtonClient({ frameId, iframeId, locale }: GameFullscreenButtonProps) {
  const [isFallbackFullscreen, setIsFallbackFullscreen] = useState(false);
  const [isNativeFullscreen, setIsNativeFullscreen] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const t = getDictionary(locale);
  const fullscreenLabel = locale === 'ko' ? '전체화면' : 'Fullscreen';

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsNativeFullscreen(isNativeFullscreenActive());
      focusIframe(iframeId);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange as EventListener);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange as EventListener);
    handleFullscreenChange();

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange as EventListener);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange as EventListener);
    };
  }, [iframeId]);

  useEffect(() => {
    const frameWrap = document.getElementById(frameId);
    if (!frameWrap) return;

    frameWrap.classList.toggle('game-frame-wrap-fallback-fullscreen', isFallbackFullscreen);
    document.body.classList.toggle('game-fullscreen-lock', isFallbackFullscreen);

    if (isFallbackFullscreen) focusIframe(iframeId);

    return () => {
      frameWrap.classList.remove('game-frame-wrap-fallback-fullscreen');
      document.body.classList.remove('game-fullscreen-lock');
    };
  }, [frameId, iframeId, isFallbackFullscreen]);

  useEffect(() => {
    if (!isFallbackFullscreen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsFallbackFullscreen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
    } catch {
      setStatus(t.game.fullscreenFailed);
    }
  };

  const enterFullscreen = async () => {
    const frameWrap = document.getElementById(frameId) as FullscreenElement | null;
    if (!frameWrap) return;

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
    } catch {
      setIsFallbackFullscreen(true);
      return;
    }

    setIsFallbackFullscreen(true);
  };

  const actionLabel = isNativeFullscreen || isFallbackFullscreen ? t.common.close : fullscreenLabel;

  return (
    <>
      <button type="button" className="game-frame-float-button" onClick={() => void (isNativeFullscreen || isFallbackFullscreen ? exitFullscreen() : enterFullscreen())} aria-label={actionLabel} title={actionLabel}>
        <span aria-hidden="true">{isNativeFullscreen || isFallbackFullscreen ? '\u2715' : '\u26F6'}</span>
      </button>
      {status ? <p className="small-copy game-frame-status">{status}</p> : null}
    </>
  );
}
