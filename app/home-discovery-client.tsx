'use client';

import { useEffect, useMemo, useState } from 'react';
import { SiteSearchForm } from '@/components/site/site-search-form';
import { GameCard } from '@/components/site/game-card';
import { HomeChampionBoard } from '@/app/home-champion-board';
import { HOME_SEARCH_EVENT } from '@/components/site/site-search-form';
import type { LeaderboardChampion } from '@/lib/games/leaderboard';
import { filterDiscoveryGames, type DiscoveryGame } from '@/lib/games/discovery';
import { getDictionary, type Locale } from '@/lib/i18n';

type Props = {
  initialQuery: string;
  games: DiscoveryGame[];
  champions: LeaderboardChampion[];
  locale: Locale;
};

function readQueryFromLocation() {
  if (typeof window === 'undefined') {
    return '';
  }

  return new URL(window.location.href).searchParams.get('q') ?? '';
}

export function HomeDiscoveryClient({ initialQuery, games, champions, locale }: Props) {
  const [query, setQuery] = useState(initialQuery);
  const t = getDictionary(locale);
  const searchHint =
    locale === 'ko' ? '메인 화면에서만 바로 게임을 찾을 수 있어요.' : 'Search is available right here on the home screen.';

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    const handleSearchEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{ query?: string }>;
      setQuery(customEvent.detail?.query ?? '');
    };
    const handlePopState = () => setQuery(readQueryFromLocation());

    window.addEventListener(HOME_SEARCH_EVENT, handleSearchEvent as EventListener);
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener(HOME_SEARCH_EVENT, handleSearchEvent as EventListener);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const visibleGames = useMemo(() => filterDiscoveryGames(games, query, 'all'), [games, query]);

  return (
    <>
      <section className="panel-card home-search-panel">
        <div className="home-search-copy">
          <h2>{locale === 'ko' ? '게임 찾기' : 'Find a Game'}</h2>
          <p className="small-copy">{searchHint}</p>
        </div>
        <SiteSearchForm className="home-search-form" initialQuery={initialQuery} placeholder={t.common.searchPlaceholder} />
      </section>

      <HomeChampionBoard champions={champions} locale={locale} />

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
    </>
  );
}
