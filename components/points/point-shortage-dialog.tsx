'use client';

import { useEffect, useState } from 'react';
import type { Locale } from '@/lib/i18n';
import type { PointPackage } from '@/lib/points/service';
import { dispatchPointBalanceUpdated } from '@/point-balance-events';

type PackagesResponse = {
  packages?: PointPackage[];
  error?: string;
};

type PurchaseResponse = {
  autoApproved?: boolean;
  balance?: number;
  error?: string;
};

type Props = {
  open: boolean;
  locale: Locale;
  pointBalance: number;
  requiredPoints: number;
  onClose: () => void;
  onPurchased: (balance: number) => void;
};

function tx(locale: Locale, ko: string, en: string) {
  return locale === 'ko' ? ko : en;
}

export function PointShortageDialog({
  open,
  locale,
  pointBalance,
  requiredPoints,
  onClose,
  onPurchased
}: Props) {
  const [packages, setPackages] = useState<PointPackage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingPackageId, setPendingPackageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;

    async function loadPackages() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(new URL('/api/points/packages', window.location.origin).toString(), {
          cache: 'no-store'
        });
        const data = (await response.json().catch(() => null)) as PackagesResponse | null;

        if (!response.ok || !data?.packages) {
          throw new Error(data?.error ?? tx(locale, '포인트 상품을 불러오지 못했어요.', 'Could not load point packages.'));
        }

        if (!cancelled) {
          setPackages(data.packages);
        }
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : tx(locale, '포인트 상품을 불러오지 못했어요.', 'Could not load point packages.'));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !pendingPackageId) {
        onClose();
      }
    };

    void loadPackages();
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      cancelled = true;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [locale, onClose, open, pendingPackageId]);

  async function buyPoints(packageId: string) {
    setPendingPackageId(packageId);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch(new URL('/api/points/purchase', window.location.origin).toString(), {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        cache: 'no-store',
        body: JSON.stringify({ packageId })
      });

      const data = (await response.json().catch(() => null)) as PurchaseResponse | null;
      if (!response.ok || !data?.autoApproved) {
        throw new Error(data?.error ?? tx(locale, '포인트를 충전하지 못했어요.', 'Could not add points right now.'));
      }

      const nextBalance = typeof data.balance === 'number' ? data.balance : pointBalance;
      onPurchased(nextBalance);
      dispatchPointBalanceUpdated(nextBalance);
      setNotice(tx(locale, '포인트가 바로 추가되었어요.', 'Points were added right away.'));

      if (nextBalance >= requiredPoints) {
        onClose();
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : tx(locale, '포인트를 충전하지 못했어요.', 'Could not add points right now.'));
    } finally {
      setPendingPackageId(null);
    }
  }

  if (!open) {
    return null;
  }

  return (
    <div className="dialog-backdrop point-shortage-backdrop" role="presentation" onClick={pendingPackageId ? undefined : onClose}>
      <div
        className="dialog-card panel-card point-shortage-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="point-shortage-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="point-shortage-copy">
          <h2 id="point-shortage-title">{tx(locale, '포인트가 조금 더 필요해요', 'You need a few more points')}</h2>
          <p>
            {tx(
              locale,
              `지금 포인트는 ${pointBalance}점이고, 이번 AI 작업에는 ${requiredPoints}점이 필요해요.`,
              `You have ${pointBalance} points, and this AI action needs ${requiredPoints} points.`
            )}
          </p>
        </div>

        {notice ? <p className="admin-notice">{notice}</p> : null}
        {error ? <p className="error-text">{error}</p> : null}

        {isLoading ? (
          <p className="small-copy">{tx(locale, '포인트 상품을 불러오는 중이에요...', 'Loading point packages...')}</p>
        ) : (
          <div className="points-package-grid points-package-grid-shortage">
            {packages.map((pointPackage) => (
              <article key={pointPackage.id} className="panel-card points-package-card point-shortage-package-card">
                <h3>{pointPackage.name}</h3>
                <p className="points-package-points">{pointPackage.points} pt</p>
                <button
                  type="button"
                  className="button-primary"
                  onClick={() => void buyPoints(pointPackage.id)}
                  disabled={pendingPackageId === pointPackage.id}
                >
                  {pendingPackageId === pointPackage.id
                    ? tx(locale, '충전 중...', 'Adding...')
                    : tx(locale, '무료로 충전하기', 'Buy now (Free)')}
                </button>
              </article>
            ))}
          </div>
        )}

        <div className="dialog-actions">
          <button type="button" className="button-secondary" onClick={onClose} disabled={Boolean(pendingPackageId)}>
            {tx(locale, '닫기', 'Close')}
          </button>
        </div>
      </div>
    </div>
  );
}
