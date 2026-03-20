'use client';

import { useEffect, useState } from 'react';
import { POINT_BALANCE_UPDATED_EVENT } from '@/point-balance-events';

type Props = {
  href: string;
  className: string;
  label: string;
  initialBalance: number;
};

export default function PointBalanceLink({ href, className, label, initialBalance }: Props) {
  const [balance, setBalance] = useState(initialBalance);

  useEffect(() => {
    setBalance(initialBalance);
  }, [initialBalance]);

  useEffect(() => {
    const handleBalanceUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{ balance?: number }>).detail;
      if (typeof detail?.balance === 'number') {
        setBalance(detail.balance);
      }
    };

    window.addEventListener(POINT_BALANCE_UPDATED_EVENT, handleBalanceUpdated as EventListener);
    return () => window.removeEventListener(POINT_BALANCE_UPDATED_EVENT, handleBalanceUpdated as EventListener);
  }, []);

  return (
    <a href={href} className={className}>
      {label} {balance}
    </a>
  );
}
