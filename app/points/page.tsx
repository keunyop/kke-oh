import { GoogleAdSlot } from '@/components/ads/google-ad-slot';
import { requireUser } from '@/lib/auth';
import { getRequestLocale } from '@/lib/i18n/server';
import { getUserPointBalance, listPointPackages, listUserPointLedger } from '@/lib/points/service';
import PointsDashboard from './points-dashboard';

export const dynamic = 'force-dynamic';

export default async function PointsPage() {
  const locale = getRequestLocale();
  const user = await requireUser('/points');
  const [balance, ledger, packages] = await Promise.all([
    getUserPointBalance(user.id),
    listUserPointLedger(user.id, 30),
    listPointPackages()
  ]);

  return (
    <section className="upload-page">
      <GoogleAdSlot placement="points" label={locale === 'ko' ? '포인트 페이지 광고' : 'Points sponsored slot'} />
      <PointsDashboard locale={locale} initialBalance={balance} initialLedger={ledger} packages={packages} />
    </section>
  );
}

