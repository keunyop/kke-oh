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
      ? '내가 만든 게임을 수정하거나, 숨기거나, 삭제할 수 있어요.'
      : 'Manage the games you created, including editing, visibility, and removal.';

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