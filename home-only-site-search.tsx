'use client';

import { usePathname } from 'next/navigation';
import { SiteSearchForm } from '@/components/site/site-search-form';

type Props = {
  placeholder: string;
  className?: string;
};

export function HomeOnlySiteSearch({ placeholder, className }: Props) {
  const pathname = usePathname();

  if (pathname !== '/') {
    return null;
  }

  return <SiteSearchForm className={className} placeholder={placeholder} />;
}
