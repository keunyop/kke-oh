import type { Metadata } from 'next';
import { SiteNavbar } from '@/app/site-navbar';
import { GoogleAdsBootstrap } from '@/components/ads/google-ads-bootstrap';
import { Footer } from '@/components/site/footer';
import { getRequestLocale } from '@/lib/i18n/server';
import { getSiteOrigin } from '@/lib/site-url';
import './globals.css';

const siteOrigin = getSiteOrigin();

export const metadata: Metadata = {
  title: 'KKE-OH!',
  description: 'A friendly place where kids can upload and play HTML games.',
  metadataBase: new URL(siteOrigin),
  alternates: {
    canonical: '/'
  },
  openGraph: {
    type: 'website',
    url: siteOrigin,
    title: 'KKE-OH!',
    description: 'A friendly place where kids can upload and play HTML games.',
    siteName: 'KKE-OH!',
    images: [
      {
        url: '/og-home.svg',
        width: 1200,
        height: 630,
        alt: 'KKE-OH game maker playground'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KKE-OH!',
    description: 'A friendly place where kids can upload and play HTML games.',
    images: ['/og-home.svg']
  },
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg'
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = getRequestLocale();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <div className="site-shell">
          <GoogleAdsBootstrap />
          <div className="site-backdrop" aria-hidden="true" />
          <SiteNavbar locale={locale} />
          <main className="page-shell">{children}</main>
          <Footer locale={locale} />
        </div>
      </body>
    </html>
  );
}
