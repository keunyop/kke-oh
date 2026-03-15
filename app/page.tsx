import Image from 'next/image';
import { GameCard } from '@/components/site/game-card';
import { listLeaderboardChampions } from '@/lib/games/leaderboard';
import { createDiscoveryGames, filterDiscoveryGames, sortDiscoveryGames } from '@/lib/games/discovery';
import { getPlaceholderThumbnailDataUrl } from '@/lib/games/placeholder';
import { getGameRepository } from '@/lib/games/repository';
import { getGameAssetUrl } from '@/lib/games/urls';
import { getDictionary } from '@/lib/i18n';
import { getRequestLocale } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

type HomePageProps = {
  searchParams?: {
    q?: string;
  };
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const locale = getRequestLocale();
  const t = getDictionary(locale);
  const allGames = await getGameRepository().listPublic();
  const discoveryGames = sortDiscoveryGames(createDiscoveryGames(allGames));
  const query = searchParams?.q ?? '';
  const visibleGames = filterDiscoveryGames(discoveryGames, query, 'all');
  const firstRowGames = visibleGames.slice(0, 6);
  const remainingGames = visibleGames.slice(6);
  const champions = await listLeaderboardChampions(allGames, 12);
  const marqueeChampions = champions.length > 1 ? [...champions, ...champions] : champions;
  const championsTitle = locale === 'ko' ? '올타임 챔피언' : 'All Time Champions';
  const championScoreLabel = locale === 'ko' ? '점수' : 'Score';

  return (
    <section className="mvp-home">
      {firstRowGames.length ? (
        <div className="game-grid" role="list">
          {firstRowGames.map((game) => (
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
                isNew={game.isNew}
                locale={locale}
                showDescription={false}
                showPlayButton={false}
                reactionDisplay="approval"
              />
            </div>
          ))}
        </div>
      ) : null}

      {champions.length ? (
        <section className="panel-card home-champions" aria-labelledby="home-champions-title">
          <div className="home-champions-copy">
            <h2 id="home-champions-title">{championsTitle}</h2>
          </div>
          <div className="home-champions-marquee">
            <div className={`home-champions-track${champions.length > 1 ? ' is-animated' : ''}`} role="list" aria-label={championsTitle}>
              {marqueeChampions.map((champion, index) => {
                const imageUrl = champion.thumbnailPath
                  ? getGameAssetUrl(champion.gameId, champion.thumbnailPath)
                  : getPlaceholderThumbnailDataUrl(champion.title);
                const isDuplicate = champions.length > 1 && index >= champions.length;

                return (
                  <a
                    key={`${champion.gameId}-${champion.playerName}-${index}`}
                    href={`/game/${champion.slug}`}
                    className="home-champion-card"
                    role="listitem"
                    aria-hidden={isDuplicate}
                    tabIndex={isDuplicate ? -1 : undefined}
                  >
                    <div className="home-champion-media">
                      <Image src={imageUrl} alt={champion.title} fill className="game-card-image" unoptimized />
                    </div>
                    <div className="home-champion-body">
                      <h3>{champion.title}</h3>
                      <p className="home-champion-player">{champion.playerName}</p>
                      <p className="home-champion-score">
                        {championScoreLabel} <strong>{champion.score.toLocaleString(locale === 'ko' ? 'ko-KR' : 'en-US')}</strong>
                      </p>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      {remainingGames.length ? (
        <div className="game-grid" role="list">
          {remainingGames.map((game) => (
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
                isNew={game.isNew}
                locale={locale}
                showDescription={false}
                showPlayButton={false}
                reactionDisplay="approval"
              />
            </div>
          ))}
        </div>
      ) : null}

      {!visibleGames.length ? (
        <section className="empty-state-card">
          <h2>{t.home.emptyTitle}</h2>
          <p>{t.home.emptyDescription}</p>
          <a href="/submit" className="button-primary">
            {t.home.firstUpload}
          </a>
        </section>
      ) : null}
    </section>
  );
}
