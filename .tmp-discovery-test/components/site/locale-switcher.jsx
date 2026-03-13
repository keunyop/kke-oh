'use client';
export function LocaleSwitcher({ locale }) {
    async function changeLocale(nextLocale) {
        if (nextLocale === locale)
            return;
        await fetch('/api/locale', {
            method: 'POST',
            headers: {
                'content-type': 'application/json'
            },
            body: JSON.stringify({ locale: nextLocale })
        });
        window.location.reload();
    }
    return (<label className="locale-switcher">
      <select className="locale-select" value={locale} onChange={(event) => void changeLocale(event.target.value)} aria-label="Choose language">
        <option value="en">English</option>
        <option value="ko">한국어</option>
      </select>
    </label>);
}
