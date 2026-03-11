import type { Metadata } from 'next';
import { Navbar } from '@/components/site/navbar';
import './globals.css';

export const metadata: Metadata = {
  title: 'KKE-OH!',
  description: '아이들도 쉽게 HTML 게임을 올리고 즐길 수 있는 놀이터'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
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
