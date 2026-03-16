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
      <section className="panel-card">
        <h1>{locale === 'ko' ? '포인트' : 'Points'}</h1>
        <p>
          {locale === 'ko'
            ? 'AI로 게임을 만들거나 수정할 때 포인트를 사용하고, 플레이와 리워드 광고, 구매로 포인트를 모을 수 있어요.'
            : 'Spend points on AI creation and editing, and earn them from gameplay, rewarded ads, and purchases.'}
        </p>
      </section>
      <PointsDashboard locale={locale} initialBalance={balance} initialLedger={ledger} packages={packages} />
    </section>
  );
}
