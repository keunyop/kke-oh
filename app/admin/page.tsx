import { redirect } from 'next/navigation';
import { listAdminUsersWithPoints } from '@/lib/admin/service';
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
        <h1>Admin only</h1>
        <p>This page is available only to admin accounts.</p>
        <a href="/" className="button-primary">
          Back home
        </a>
      </section>
    );
  }

  const [games, users] = await Promise.all([
    getGameRepository().listForAdmin(200),
    listAdminUsersWithPoints(200)
  ]);

  return (
    <section className="admin-page">
      <section className="panel-card admin-hero admin-hero-simple">
        <div>
          <h1>{locale === 'ko' ? 'Operations' : 'Operations Control Panel'}</h1>
          <p>Review game moderation status and member point balances from one place.</p>
        </div>
        <p className="small-copy">Only admin accounts can access this tool.</p>
      </section>

      <AdminDashboard initialGames={games} initialUsers={users} locale={locale} adminLoginId={user.loginId} adminUserId={user.id} />
    </section>
  );
}
