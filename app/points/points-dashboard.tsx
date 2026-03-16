'use client';

import { useState } from 'react';
import type { PointLedgerEntry, PointPackage } from '@/lib/points/service';
import type { Locale } from '@/lib/i18n';

type Props = {
  locale: Locale;
  initialBalance: number;
  initialLedger: PointLedgerEntry[];
  packages: PointPackage[];
};

export default function PointsDashboard({ locale, initialBalance, initialLedger, packages }: Props) {
  const [balance, setBalance] = useState(initialBalance);
  const [ledger, setLedger] = useState(initialLedger);
  const [pendingPackageId, setPendingPackageId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function buyPoints(packageId: string) {
    setPendingPackageId(packageId);
    setNotice(null);
    setError(null);

    try {
      const response = await fetch('/api/points/purchase', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({ packageId })
      });
      const data = (await response.json()) as {
        order?: { id: string };
        autoApproved?: boolean;
        error?: string;
      };

      if (!response.ok || !data.order) {
        throw new Error(data.error ?? 'Could not create the point purchase order.');
      }

      if (data.autoApproved) {
        const balanceResponse = await fetch('/api/points/balance', { cache: 'no-store' });
        const balanceData = (await balanceResponse.json()) as { balance?: number };
        if (balanceResponse.ok && typeof balanceData.balance === 'number') {
          setBalance(balanceData.balance);
        }

        const ledgerResponse = await fetch('/api/points/ledger?limit=30', { cache: 'no-store' });
        const ledgerData = (await ledgerResponse.json()) as { entries?: PointLedgerEntry[] };
        if (ledgerResponse.ok && ledgerData.entries) {
          setLedger(ledgerData.entries);
        }

        setNotice(locale === 'ko' ? '포인트가 바로 지급되었어요.' : 'Points were added right away.');
        return;
      }

      setNotice(
        locale === 'ko'
          ? '구매 주문이 생성되었어요. 실제 결제 연동 전까지는 자동 승인되지 않을 수 있어요.'
          : 'The purchase order was created. It may stay pending until a real payment integration is connected.'
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not create the point purchase order.');
    } finally {
      setPendingPackageId(null);
    }
  }

  return (
    <div className="points-dashboard">
      <section className="panel-card points-balance-card">
        <p className="small-copy">{locale === 'ko' ? '현재 포인트' : 'Current points'}</p>
        <h2>{balance}</h2>
        <p>{locale === 'ko' ? '게임 플레이, 리워드 광고, 포인트 구매로 모을 수 있어요.' : 'Earn points from gameplay, rewarded ads, and point purchases.'}</p>
      </section>

      {notice ? <p className="admin-notice">{notice}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      <section className="points-package-grid">
        {packages.map((pointPackage) => (
          <article key={pointPackage.id} className="panel-card points-package-card">
            <h3>{pointPackage.name}</h3>
            <p className="points-package-points">{pointPackage.points} pt</p>
            <p className="small-copy">${(pointPackage.priceCents / 100).toFixed(2)}</p>
            <button
              type="button"
              className="button-primary"
              onClick={() => void buyPoints(pointPackage.id)}
              disabled={pendingPackageId === pointPackage.id}
            >
              {pendingPackageId === pointPackage.id
                ? locale === 'ko'
                  ? '처리 중...'
                  : 'Working...'
                : locale === 'ko'
                  ? '포인트 구매'
                  : 'Buy points'}
            </button>
          </article>
        ))}
      </section>

      <section className="panel-card">
        <h2>{locale === 'ko' ? '포인트 내역' : 'Point history'}</h2>
        {ledger.length ? (
          <div className="points-ledger-list">
            {ledger.map((entry) => (
              <div key={entry.id} className="points-ledger-row">
                <div>
                  <strong>{entry.sourceType}</strong>
                  <p className="small-copy">{entry.createdAt.slice(0, 16).replace('T', ' ')}</p>
                </div>
                <div className={`points-ledger-delta${entry.delta < 0 ? ' is-negative' : ''}`}>
                  {entry.delta > 0 ? '+' : ''}
                  {entry.delta}
                </div>
                <div className="small-copy">{locale === 'ko' ? '잔액' : 'Balance'} {entry.balanceAfter}</div>
              </div>
            ))}
          </div>
        ) : (
          <p>{locale === 'ko' ? '아직 포인트 내역이 없어요.' : 'No point history yet.'}</p>
        )}
      </section>
    </div>
  );
}
