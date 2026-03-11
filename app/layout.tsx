import type { Metadata } from 'next';
import { Footer } from '@/components/site/footer';
import { Navbar } from '@/components/site/navbar';
import { getRequestLocale } from '@/lib/i18n/server';
import './globals.css';

export const metadata: Metadata = {
  title: 'KKE-OH!',
  description: 'A friendly place where kids can upload and play HTML games.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = getRequestLocale();

  return (
    <html lang={locale}>
      <body>
        <div className="site-shell">
          <div className="site-backdrop" aria-hidden="true" />
          <Navbar locale={locale} />
          <main className="page-shell">{children}</main>
          <Footer locale={locale} />
        </div>
      </body>
    </html>
  );
}
