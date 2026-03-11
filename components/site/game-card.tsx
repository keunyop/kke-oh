import Image from 'next/image';

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
            플레이
          </a>
        </div>
      </div>
      <div className="game-card-body">
        <h3>{title}</h3>
        <div className="game-card-stats">
          <span>플레이 {playCount}</span>
          <span>좋아요 {likeCount}</span>
          <span>싫어요 {dislikeCount}</span>
        </div>
        <div className="game-card-uploader">원작자 {uploaderName}</div>
      </div>
      <a href={href} className="game-card-link" aria-label={`Open ${title}`} />
      <span className="sr-only">Game id {id}</span>
      <span className="sr-only">{description}</span>
    </article>
  );
}
