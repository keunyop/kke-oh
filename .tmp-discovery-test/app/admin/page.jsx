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
        return (<section className="empty-state-card">
        <h1>{locale === 'ko' ? '\uAD00\uB9AC\uC790 \uC804\uC6A9 \uD398\uC774\uC9C0' : 'Admin only'}</h1>
        <p>
          {locale === 'ko'
                ? '\uC774 \uD398\uC774\uC9C0\uB294 \uAD00\uB9AC\uC790 \uACC4\uC815\uC5D0\uC11C\uB9CC \uC811\uADFC\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.'
                : 'This page is available only to admin accounts.'}
        </p>
        <a href="/" className="button-primary">
          {locale === 'ko' ? '\uD648\uC73C\uB85C' : 'Back home'}
        </a>
      </section>);
    }
    const games = await getGameRepository().listForAdmin(200);
    return (<section className="admin-page">
      <div className="panel-card admin-hero">
        <div>
          <span className="pill-label">{locale === 'ko' ? '\uAD00\uB9AC' : 'Admin'}</span>
          <h1>{locale === 'ko' ? '\uAC8C\uC784 \uAD00\uB9AC \uD328\uB110' : 'Game Control Panel'}</h1>
          <p>
            {locale === 'ko'
            ? '\uAC8C\uC784 \uACF5\uAC1C \uC0C1\uD0DC, \uC2E0\uACE0, \uC228\uAE40, \uC0AD\uC81C \uC5EC\uBD80\uB97C \uD55C \uACF3\uC5D0\uC11C \uD655\uC778\uD558\uACE0 \uAD00\uB9AC\uD569\uB2C8\uB2E4.'
            : 'Review visibility, reports, moderation flags, and removal state for every uploaded game.'}
          </p>
        </div>
        <div className="admin-hero-meta">
          <strong>{user.loginId}</strong>
          <p>
            {locale === 'ko'
            ? '\uC544\uBC14\uD0C0 \uBA54\uB274\uC5D0 \uAD00\uB9AC\uC790 \uBC84\uD2BC\uC774 \uB178\uCD9C\uB418\uB294 \uACC4\uC815\uB9CC \uC811\uADFC\uAC00 \uB418\uB3C4\uB85D \uC81C\uD55C\uD588\uC2B5\uB2C8\uB2E4.'
            : 'Only the accounts that show the admin button in the avatar menu can open this page.'}
          </p>
        </div>
      </div>

      <AdminDashboard initialGames={games} locale={locale} adminLoginId={user.loginId}/>
    </section>);
}
