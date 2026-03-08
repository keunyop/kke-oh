import Image from 'next/image';

type GameCardProps = {
  id: string;
  title: string;
  description: string;
  href: string;
  imageUrl?: string | null;
  badge?: string;
  makerLabel?: string;
  meta: string;
  emphasis?: 'default' | 'wide';
};

export function GameCard({
  id,
  title,
  description,
  href,
  imageUrl,
  badge,
  makerLabel,
  meta,
  emphasis = 'default'
}: GameCardProps) {
  return (
    <article className={`game-card${emphasis === 'wide' ? ' game-card-wide' : ''}`}>
      <div className="game-card-media">
        {imageUrl ? (
          <Image src={imageUrl} alt={title} fill className="game-card-image" unoptimized />
        ) : (
          <div className="game-card-fallback" aria-hidden="true">
            <span>{title.slice(0, 1).toUpperCase()}</span>
          </div>
        )}
        <div className="game-card-overlay">
          <a href={href} className="card-action-primary">
            Play
          </a>
        </div>
      </div>
      <div className="game-card-body">
        <div className="game-card-topline">
          {badge ? <span className="game-badge">{badge}</span> : <span className="game-badge game-badge-muted">Play now</span>}
          {makerLabel ? <span className="game-maker">{makerLabel}</span> : null}
        </div>
        <h3>{title}</h3>
        <div className="game-card-meta">{meta}</div>
      </div>
      <a href={href} className="game-card-link" aria-label={`Open ${title}`} />
      <span className="sr-only">Game id {id}</span>
      <span className="sr-only">{description}</span>
    </article>
  );
}
