'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';

export const HOME_SEARCH_EVENT = 'kkeoh:home-search';

function readQueryFromLocation() {
  if (typeof window === 'undefined') {
    return '';
  }

  return new URL(window.location.href).searchParams.get('q') ?? '';
}

function buildHomeSearchUrl(query: string) {
  const trimmed = query.trim();
  return trimmed ? `/?q=${encodeURIComponent(trimmed)}` : '/';
}

export function SiteSearchForm({ initialQuery = '', placeholder, className }: { initialQuery?: string; placeholder: string; className?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const isHome = pathname === '/';

  useEffect(() => {
    setQuery(readQueryFromLocation() || initialQuery);
  }, [initialQuery, pathname]);

  useEffect(() => {
    const handlePopState = () => setQuery(readQueryFromLocation());
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  function syncHomeSearch(nextQuery: string) {
    const nextUrl = buildHomeSearchUrl(nextQuery);
    window.history.replaceState(window.history.state, '', nextUrl);
    window.dispatchEvent(new CustomEvent(HOME_SEARCH_EVENT, { detail: { query: nextQuery } }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (isHome) {
      event.preventDefault();
      syncHomeSearch(query);
      return;
    }

    event.preventDefault();
    router.push(buildHomeSearchUrl(query));
  }

  return (
    <form action="/" className={className} role="search" onSubmit={handleSubmit}>
      <input
        type="search"
        name="q"
        placeholder={placeholder}
        value={query}
        onChange={(event) => {
          const nextQuery = event.target.value;
          setQuery(nextQuery);
          if (isHome) {
            syncHomeSearch(nextQuery);
          }
        }}
        aria-label={placeholder}
      />
    </form>
  );
}
