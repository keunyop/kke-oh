import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'kke-oh (께오)',
  description: 'Kid-friendly HTML game hosting platform'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="topbar">
          <a href="/" className="brand">께오 kke-oh</a>
          <nav>
            <a href="/submit">Submit</a>
            <a href="/admin">Admin</a>
          </nav>
        </header>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
