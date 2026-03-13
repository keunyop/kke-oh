'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import type { ReactNode } from 'react';

type Props = {
  className?: string;
  children: ReactNode;
};

export function CurrentPageLoginLink({ className, children }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const nextPath = `${pathname}${query ? `?${query}` : ''}` || '/';

  return (
    <a href={`/login?next=${encodeURIComponent(nextPath)}`} className={className}>
      {children}
    </a>
  );
}