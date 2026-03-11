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
                uploaderName={game.uploaderName}
                playCount={game.playCount}
                likeCount={game.likeCount}
                dislikeCount={game.dislikeCount}
              />
            </div>
          ))}
        </div>
      ) : (
        <section className="empty-state-card">
          <h2>아직 게임이 없어요.</h2>
          <p>다른 검색어를 써보거나 새 게임을 올려보세요.</p>
          <a href="/submit" className="button-primary">
            첫 게임 올리기
          </a>
        </section>
      )}
    </section>
  );
}
