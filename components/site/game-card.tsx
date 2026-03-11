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
};

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
  emphasis = 'default'
}: GameCardProps) {
  const t = getDictionary(locale);

  return (
    <article className={`game-card${emphasis === 'wide' ? ' game-card-wide' : ''}`}>
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
        <div className="game-card-overlay">
          <a href={href} className="card-action-primary">
            {t.common.play}
          </a>
        </div>
      </div>
      <div className="game-card-body">
        <h3>{title}</h3>
        <div className="game-card-stats">
          <span>{t.common.plays} {playCount}</span>
          <span>{t.common.likes} {likeCount}</span>
          <span>{t.common.dislikes} {dislikeCount}</span>
        </div>
        <div className="game-card-uploader">{t.common.creator} {uploaderName}</div>
      </div>
      <a href={href} className="game-card-link" aria-label={`Open ${title}`} />
      <span className="sr-only">Game id {id}</span>
      <span className="sr-only">{description}</span>
    </article>
  );
}
