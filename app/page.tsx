import { GoogleAdSlot } from '@/components/ads/google-ad-slot';
import { HomeDiscoveryClient } from '@/app/home-discovery-client';
import { listLeaderboardChampions } from '@/lib/games/leaderboard';
import { createDiscoveryGames, sortDiscoveryGames } from '@/lib/games/discovery';
import { getGameRepository } from '@/lib/games/repository';
import { getRequestLocale } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

type HomePageProps = {
  searchParams?: {
    q?: string;
  };
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const locale = getRequestLocale();
  const allGames = await getGameRepository().listPublic();
  const discoveryGames = sortDiscoveryGames(createDiscoveryGames(allGames));
  const champions = await listLeaderboardChampions(allGames, 12);

  return (
    <section className="mvp-home">
      <GoogleAdSlot placement="home" label={locale === 'ko' ? '홈 추천 광고' : 'Home sponsored slot'} />
      <HomeDiscoveryClient initialQuery={searchParams?.q ?? ''} games={discoveryGames} champions={champions} locale={locale} />
    </section>
  );
}
