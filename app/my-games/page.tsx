import { requireUser } from '@/lib/auth';
import { getGameRepository } from '@/lib/games/repository';
import { getRequestLocale } from '@/lib/i18n/server';
import MyGamesPanel from './my-games-panel';

export const dynamic = 'force-dynamic';

export default async function MyGamesPage() {
  const locale = getRequestLocale();
  const user = await requireUser('/my-games');
  const games = await getGameRepository().listByUser(user.id);
  const subtitle =
    locale === 'ko'
      ? '비공개 초안을 테스트하고, 준비가 되면 직접 게시할 수 있어요.'
      : 'Manage your private drafts, test them, and publish them when they are ready.';

  return (
    <section className="upload-page">
      <section className="panel-card">
        <h1>{locale === 'ko' ? '내 게임' : 'My Games'}</h1>
        <p>{subtitle}</p>
      </section>
      <MyGamesPanel initialGames={games} locale={locale} />
    </section>
  );
}
