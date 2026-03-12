import Image from 'next/image';
import { getDictionary, type Locale } from '@/lib/i18n';

type GameCardProps = {
  id: string;
  title: string;
  description: string;
  href: string;
  imageUrl?: string | null;
  uploaderName: string;
  playCount: number;
  likeCount: number;
  dislikeCount: number;
  isNew: boolean;
  locale: Locale;
  emphasis?: 'default' | 'wide';
  showDescription?: boolean;
  showPlayButton?: boolean;
  reactionDisplay?: 'counts' | 'approval';
};

function ApprovalIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="game-card-stat-icon">
      <path
        d="M9 20H6.2A2.2 2.2 0 0 1 4 17.8v-6.1a2.2 2.2 0 0 1 2.2-2.2H9m0 10.5V9.5m0 10.5h7a2.2 2.2 0 0 0 2.15-1.73l1.05-5.25A2.2 2.2 0 0 0 18.05 10H14.5V7.45A2.45 2.45 0 0 0 12.05 5L9 9.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function GameCard({
  id,
  title,
  description,
  href,
  imageUrl,
  uploaderName,
  playCount,
  likeCount,
  dislikeCount,
  isNew,
  locale,
  emphasis = 'default',
  showDescription = true,
  showPlayButton = true,
  reactionDisplay = 'counts'
}: GameCardProps) {
  const t = getDictionary(locale);
  const totalReactions = likeCount + dislikeCount;
  const approvalPercent = totalReactions > 0 ? Math.round((likeCount / totalReactions) * 100) : 0;

  return (
    <article
      className={`game-card${emphasis === 'wide' ? ' game-card-wide' : ''}${showDescription ? '' : ' game-card-no-summary'}${showPlayButton ? '' : ' game-card-no-overlay'}`}
    >
      <div className="game-card-media">
        {imageUrl ? (
          <div className="game-card-image-frame">
            <Image src={imageUrl} alt={title} fill className="game-card-image" unoptimized />
          </div>
        ) : (
          <div className="game-card-fallback" aria-hidden="true">
            <span>{title.slice(0, 1).toUpperCase()}</span>
          </div>
        )}
        {isNew ? <span className="game-card-badge-new">{t.common.newBadge}</span> : null}
        {showPlayButton ? (
          <div className="game-card-overlay">
            <a href={href} className="card-action-primary">
              {t.common.play}
            </a>
          </div>
        ) : null}
      </div>
      <div className="game-card-body">
        <h3>{title}</h3>
        {showDescription ? <p className="game-card-summary">{description}</p> : null}
        <div className="game-card-stats">
          <span>{t.common.plays} {playCount}</span>
          {reactionDisplay === 'approval' ? (
            <span className="game-card-stat-approval" aria-label={`${t.common.likes} ${approvalPercent}%`}>
              <ApprovalIcon />
              {approvalPercent}%
            </span>
          ) : (
            <>
              <span>{t.common.likes} {likeCount}</span>
              <span>{t.common.dislikes} {dislikeCount}</span>
            </>
          )}
        </div>
        <div className="game-card-uploader">{t.common.creator} {uploaderName}</div>
      </div>
      <a href={href} className="game-card-link" aria-label={`Open ${title}`} />
      <span className="sr-only">Game id {id}</span>
      <span className="sr-only">{description}</span>
    </article>
  );
}
