'use client';

import type { Locale } from '@/lib/i18n';

export function LocaleSwitcher({ locale }: { locale: Locale }) {
  async function changeLocale(nextLocale: Locale) {
    if (nextLocale === locale) return;

    await fetch('/api/locale', {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({ locale: nextLocale })
    });

    window.location.reload();
  }

  return (
    <label className="locale-switcher">
      <select
        className="locale-select"
        value={locale}
        onChange={(event) => void changeLocale(event.target.value as Locale)}
        aria-label="Choose language"
      >
        <option value="en">English</option>
        <option value="ko">한국어</option>
      </select>
    </label>
  );
}
