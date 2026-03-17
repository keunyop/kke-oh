import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getGameRepository } from '@/lib/games/repository';
import { getRequestLocale } from '@/lib/i18n/server';
import { isAdminUser } from '@/lib/security/admin';
import AdminDashboard from './admin-dashboard';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const locale = getRequestLocale();
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login?next=/admin');
  }

  if (!isAdminUser(user)) {
    return (
      <section className="empty-state-card">
        <h1>{locale === 'ko' ? '관리자 전용 페이지' : 'Admin only'}</h1>
        <p>{locale === 'ko' ? '이 페이지는 관리자 계정만 열 수 있어요.' : 'This page is available only to admin accounts.'}</p>
        <a href="/" className="button-primary">
          {locale === 'ko' ? '홈으로' : 'Back home'}
        </a>
      </section>
    );
  }

  const games = await getGameRepository().listForAdmin(200);

  return (
    <section className="admin-page">
      <section className="panel-card admin-hero admin-hero-simple">
        <div>
          <h1>{locale === 'ko' ? '게임 관리' : 'Game Control Panel'}</h1>
          <p>
            {locale === 'ko'
              ? '공개 상태, 신고, 숨김, 삭제 여부를 한 곳에서 빠르게 확인하고 관리해요.'
              : 'Review visibility, reports, hidden state, and removals from one place.'}
          </p>
        </div>
        <p className="small-copy">
          {locale === 'ko' ? '관리자 권한이 있는 계정만 이 도구를 볼 수 있어요.' : 'Only admin accounts can access this tool.'}
        </p>
      </section>

      <AdminDashboard initialGames={games} locale={locale} adminLoginId={user.loginId} />
    </section>
  );
}

