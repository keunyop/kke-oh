import type { Metadata } from 'next';
import { Navbar } from '@/components/site/navbar';
import './globals.css';

export const metadata: Metadata = {
  title: 'KKE-OH!',
  description: 'An easy place for kids to upload and play HTML games.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="site-shell">
          <div className="site-backdrop" aria-hidden="true" />
          <Navbar />
          <main className="page-shell">{children}</main>
        </div>
      </body>
    </html>
  );
}
