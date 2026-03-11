import { cookies, headers } from 'next/headers';
import { LOCALE_COOKIE_NAME, isLocale, type Locale } from '@/lib/i18n';

function getRequestCountryCode() {
  const headerStore = headers();
  const headerNames = [
    'x-vercel-ip-country',
    'cf-ipcountry',
    'cloudfront-viewer-country',
    'x-country-code',
    'x-appengine-country',
    'geoip-country-code',
    'x-geo-country'
  ];

  for (const headerName of headerNames) {
    const value = headerStore.get(headerName)?.trim().toUpperCase();
    if (value && value !== 'XX' && value !== 'T1') {
      return value;
    }
  }

  const acceptLanguage = headerStore.get('accept-language') ?? '';
  const regionMatch = acceptLanguage.match(/\b[a-z]{2,3}[-_]([A-Z]{2})\b/);
  if (regionMatch) {
    return regionMatch[1].toUpperCase();
  }

  if (/\bko\b/i.test(acceptLanguage)) {
    return 'KR';
  }

  return null;
}

export function getRequestLocale(): Locale {
  const cookieValue = cookies().get(LOCALE_COOKIE_NAME)?.value;
  if (cookieValue && isLocale(cookieValue)) {
    return cookieValue;
  }

  return getRequestCountryCode() === 'KR' ? 'ko' : 'en';
}
