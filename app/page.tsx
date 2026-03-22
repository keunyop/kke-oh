import { GoogleAdSlot } from '@/components/ads/google-ad-slot';
import { HomeAiStarter } from '@/app/home-ai-starter';
import { HomeDiscoveryClient } from '@/app/home-discovery-client';
import { listAiModels } from '@/lib/ai/models';
import { getCurrentUser } from '@/lib/auth';
import { createDiscoveryGames, sortDiscoveryGames } from '@/lib/games/discovery';
import { listLeaderboardChampions } from '@/lib/games/leaderboard';
import { getGameRepository } from '@/lib/games/repository';
import { getRequestLocale } from '@/lib/i18n/server';
import { getUserPointBalance } from '@/lib/points/service';

export const dynamic = 'force-dynamic';

type HomePageProps = {
  searchParams?: {
    q?: string;
  };
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const locale = getRequestLocale();
  const repository = getGameRepository();
  const [allGames, models, user] = await Promise.all([repository.listPublic(), listAiModels(), getCurrentUser()]);
  const discoveryGames = sortDiscoveryGames(createDiscoveryGames(allGames));
  const champions = await listLeaderboardChampions(allGames, 12);
  const pointBalance = user ? await getUserPointBalance(user.id) : null;

  return (
    <section className="mvp-home">
      <HomeAiStarter
        locale={locale}
        models={models.map((model) => ({
          id: model.id,
          label: model.label,
          kidDescription: model.kidDescription,
          pointCostCreate: model.pointCostCreate
        }))}
        isLoggedIn={Boolean(user)}
        pointBalance={pointBalance}
      />
      <GoogleAdSlot placement="home" label={locale === 'ko' ? '홈 추천 광고' : 'Home sponsored slot'} />
      <HomeDiscoveryClient initialQuery={searchParams?.q ?? ''} games={discoveryGames} champions={champions} locale={locale} />
    </section>
  );
}
