const DEFAULT_SITE_ORIGIN = 'https://kke-oh.vercel.app';

function normalizeSiteOrigin(value: string | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/\/+$/g, '');
  }

  return `https://${trimmed.replace(/^\/+|\/+$/g, '')}`;
}

export function getSiteOrigin(): string {
  return (
    normalizeSiteOrigin(process.env.NEXT_PUBLIC_SITE_URL) ??
    normalizeSiteOrigin(process.env.SITE_URL) ??
    normalizeSiteOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
    normalizeSiteOrigin(process.env.VERCEL_URL) ??
    DEFAULT_SITE_ORIGIN
  );
}

export function toAbsoluteSiteUrl(pathname: string): string {
  return new URL(pathname, getSiteOrigin()).toString();
}
