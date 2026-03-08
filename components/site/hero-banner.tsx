import Image from 'next/image';

type HeroBannerProps = {
  title: string;
  description: string;
  href: string;
  imageUrl?: string | null;
  badge?: string;
  makerLabel?: string;
  statLine: string;
};

export function HeroBanner({ title, description, href, imageUrl, badge, makerLabel, statLine }: HeroBannerProps) {
  return (
    <section className="hero-banner">
      <div className="hero-copy">
        <div className="hero-kicker-row">
          <span className="hero-kicker">{badge ?? 'Featured'}</span>
          {makerLabel ? <span className="hero-maker">{makerLabel}</span> : null}
        </div>
        <h1>{title}</h1>
        <p>{description}</p>
        <div className="hero-stats">{statLine}</div>
        <div className="hero-actions">
          <a href={href} className="button-primary">
            Play Now
          </a>
          <a href={href} className="button-secondary">
            Details
          </a>
        </div>
      </div>
      <div className="hero-art">
        {imageUrl ? (
          <Image src={imageUrl} alt={title} fill className="hero-image" priority unoptimized />
        ) : (
          <div className="hero-fallback" aria-hidden="true">
            <span>{title}</span>
          </div>
        )}
      </div>
    </section>
  );
}
