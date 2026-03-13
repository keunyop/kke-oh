import { GameCard } from '@/components/site/game-card';
import { createDiscoveryGames, filterDiscoveryGames, sortDiscoveryGames } from '@/lib/games/discovery';
import { getGameRepository } from '@/lib/games/repository';
import { getDictionary } from '@/lib/i18n';
import { getRequestLocale } from '@/lib/i18n/server';
export const dynamic = 'force-dynamic';
export default async function HomePage({ searchParams }) {
    const locale = getRequestLocale();
    const t = getDictionary(locale);
    const allGames = await getGameRepository().listPublic();
    const discoveryGames = sortDiscoveryGames(createDiscoveryGames(allGames));
    const query = searchParams?.q ?? '';
    const visibleGames = filterDiscoveryGames(discoveryGames, query, 'all');
    return (<section className="mvp-home">
      {visibleGames.length ? (<div className="game-grid" role="list">
          {visibleGames.map((game) => (<div key={game.id} role="listitem">
              <GameCard id={game.id} title={game.title} description={game.description} href={game.href} imageUrl={game.imageUrl} uploaderName={game.uploaderName} playCount={game.playCount} likeCount={game.likeCount} dislikeCount={game.dislikeCount} isNew={game.isNew} locale={locale} showDescription={false} showPlayButton={false} reactionDisplay="approval"/>
            </div>))}
        </div>) : (<section className="empty-state-card">
          <h2>{t.home.emptyTitle}</h2>
          <p>{t.home.emptyDescription}</p>
          <a href="/submit" className="button-primary">
            {t.home.firstUpload}
          </a>
        </section>)}
    </section>);
}
