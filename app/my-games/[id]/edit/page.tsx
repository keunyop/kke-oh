import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { getGameRepository } from '@/lib/games/repository';
import { getRequestLocale } from '@/lib/i18n/server';
import { EditGameForm } from '@/app/my-games/edit-game-form';

export const dynamic = 'force-dynamic';

export default async function EditGamePage({ params }: { params: { id: string } }) {
  const locale = getRequestLocale();
  const user = await requireUser(`/my-games/${params.id}/edit`);
  const game = await getGameRepository().getById(params.id);

  if (!game || game.uploader_user_id !== user.id) {
    notFound();
  }

  return (
    <section className="upload-page">
      <section className="panel-card">
        <h1>{locale === 'ko' ? '게임 수정하기' : 'Edit Game'}</h1>
        <p>
          {locale === 'ko'
            ? '제목, 설명, 썸네일을 바꾸거나 새 파일 또는 AI로 게임 내용을 다시 만들 수 있어요.'
            : 'Change the title, description, thumbnail, or rebuild the game with new files or AI.'}
        </p>
      </section>
      <EditGameForm game={game} locale={locale} />
    </section>
  );
}
