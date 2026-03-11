import { GameCard } from '@/components/site/game-card';
import type { Locale } from '@/lib/i18n';

type CardItem = {
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
};

type SectionRowProps = {
  title: string;
  subtitle: string;
  seeAllHref: string;
  cards: CardItem[];
};

export function SectionRow({ title, subtitle, seeAllHref, cards }: SectionRowProps) {
  return (
    <section className="content-section">
      <div className="section-heading">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <a href={seeAllHref} className="section-link">
          See all
        </a>
      </div>
      <div className="card-row" role="list">
        {cards.map((card, index) => (
          <div key={`${title}-${card.id}-${index}`} role="listitem" className="card-row-item">
            <GameCard {...card} emphasis={index === 0 ? 'wide' : 'default'} />
          </div>
        ))}
      </div>
    </section>
  );
}
