import { requireUser } from '@/lib/auth';
import { getGameRepository } from '@/lib/games/repository';
import { getDictionary } from '@/lib/i18n';
import { getRequestLocale } from '@/lib/i18n/server';
import MyGamesPanel from './my-games-panel';

export const dynamic = 'force-dynamic';

export default async function MyGamesPage() {
  const locale = getRequestLocale();
  const user = await requireUser('/my-games');
  const t = getDictionary(locale);
  const games = await getGameRepository().listByUser(user.id);
  const subtitle =
    locale === 'ko'
      ? '내가 만든 게임의 공개 상태를 바꾸거나 삭제할 수 있어요.'
      : 'Manage the games you created, including visibility and removal.';

  return (
    <section className="upload-page">
      <section className="panel-card">
        <h1>{locale === 'ko' ? '나의 게임' : 'My Games'}</h1>
        <p>
          {t.upload.loginAs}: {user.loginId}
        </p>
        <p>{subtitle}</p>
      </section>
      <MyGamesPanel initialGames={games} locale={locale} />
    </section>
  );
}
