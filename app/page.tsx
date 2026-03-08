import { GameCard } from '@/components/site/game-card';
import { createDiscoveryGames, filterDiscoveryGames } from '@/lib/games/discovery';
import { getGameRepository } from '@/lib/games/repository';

export const dynamic = 'force-dynamic';

type HomePageProps = {
  searchParams?: {
    q?: string;
  };
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const allGames = await getGameRepository().listPublic();
  const discoveryGames = createDiscoveryGames(allGames).sort((left, right) => right.score - left.score);
  const query = searchParams?.q ?? '';
  const visibleGames = filterDiscoveryGames(discoveryGames, query, 'all');

  return (
    <section className="mvp-home">
      {visibleGames.length ? (
        <div className="game-grid" role="list">
          {visibleGames.map((game) => (
            <div key={game.id} role="listitem">
              <GameCard
                id={game.id}
                title={game.title}
                description={game.description}
                href={game.href}
                imageUrl={game.imageUrl}
                badge={game.badge}
                makerLabel={undefined}
                meta={game.meta}
              />
            </div>
          ))}
        </div>
      ) : (
        <section className="empty-state-card">
          <h2>No games found.</h2>
          <p>Try another search or upload a new game.</p>
          <a href="/submit" className="button-primary">
            Upload First Game
          </a>
        </section>
      )}
    </section>
  );
}
