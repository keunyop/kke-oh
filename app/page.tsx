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
  const champions = await listLeaderboardChampions(allGames, 6);
  const championsTitle = locale === 'ko' ? '이번 주 챔피언' : 'Top Champions';
  const championsDescription =
    locale === 'ko'
      ? '리더보드가 있는 게임들 중 각 게임 1위만 모았어요.'
      : 'Only the #1 score from each leaderboard-enabled game.';
  const championScoreLabel = locale === 'ko' ? '점수' : 'Score';
  const championWinnerLabel = locale === 'ko' ? '1위' : '#1';

  return (
    <section className="mvp-home">
      {champions.length ? (
        <section className="panel-card home-champions">
          <div className="home-champions-copy">
            <span className="pill-label">Leaderboard</span>
            <h2>{championsTitle}</h2>
            <p>{championsDescription}</p>
          </div>
          <div className="home-champions-grid" role="list">
            {champions.map((champion, index) => {
              const imageUrl = champion.thumbnailPath
                ? getGameAssetUrl(champion.gameId, champion.thumbnailPath)
                : getPlaceholderThumbnailDataUrl(champion.title);

              return (
                <a key={`${champion.gameId}-${champion.playerName}`} href={`/game/${champion.slug}`} className="home-champion-card" role="listitem">
                  <div className="home-champion-media">
                    <Image src={imageUrl} alt={champion.title} fill className="game-card-image" unoptimized />
                    <span className="home-champion-rank">#{index + 1}</span>
                  </div>
                  <div className="home-champion-body">
                    <p className="small-copy">{championWinnerLabel}</p>
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
        </section>
      ) : null}

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
                isNew={game.isNew}
                locale={locale}
                showDescription={false}
                showPlayButton={false}
                reactionDisplay="approval"
              />
            </div>
          ))}
        </div>
      ) : (
        <section className="empty-state-card">
          <h2>{t.home.emptyTitle}</h2>
          <p>{t.home.emptyDescription}</p>
          <a href="/submit" className="button-primary">
            {t.home.firstUpload}
          </a>
        </section>
      )}
    </section>
  );
}
