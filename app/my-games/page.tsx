import { GoogleAdSlot } from '@/components/ads/google-ad-slot';
import { requireUser } from '@/lib/auth';
import { getGameRepository } from '@/lib/games/repository';
import { getRequestLocale } from '@/lib/i18n/server';
import MyGamesPanelClient from './my-games-panel-client';

export const dynamic = 'force-dynamic';

export default async function MyGamesPage({ searchParams }: { searchParams?: { notice?: string; game?: string } }) {
  const locale = getRequestLocale();
  const user = await requireUser('/my-games');
  const games = await getGameRepository().listByUser(user.id);
  const subtitle =
    locale === 'ko'
      ? '초안을 테스트하고, 공개한 게임은 숨기거나 다시 공개할 수 있어요.'
      : 'Test your drafts, then hide or re-open published games whenever you need.';

  return (
    <section className="upload-page">
      <GoogleAdSlot placement="my-games" label={locale === 'ko' ? '내 게임 광고' : 'My Games sponsored slot'} />
      <section className="panel-card">
        <h1>{locale === 'ko' ? '내 게임' : 'My Games'}</h1>
        <p>{subtitle}</p>
      </section>
      {searchParams?.notice === 'created' ? (
        <p className="admin-notice">
          {locale === 'ko'
            ? '새 게임 초안이 저장되었어요. 여기서 테스트하고 준비가 되면 게시해보세요.'
            : 'Your new draft was saved. Test it here, then publish it when you are ready.'}
        </p>
      ) : null}
      <MyGamesPanelClient initialGames={games} locale={locale} />
    </section>
  );
}
