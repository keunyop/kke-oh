import { SiteNavbar } from '@/app/_components/site-navbar';
import { Footer } from '@/components/site/footer';
import { getRequestLocale } from '@/lib/i18n/server';
import './globals.css';
export const metadata = {
    title: 'KKE-OH!',
    description: 'A friendly place where kids can upload and play HTML games.',
    icons: {
        icon: '/icon.svg',
        shortcut: '/icon.svg',
        apple: '/icon.svg'
    }
};
export default function RootLayout({ children }) {
    const locale = getRequestLocale();
    return (<html lang={locale}>
      <body>
        <div className="site-shell">
          <div className="site-backdrop" aria-hidden="true"/>
          <SiteNavbar locale={locale}/>
          <main className="page-shell">{children}</main>
          <Footer locale={locale}/>
        </div>
        <script dangerouslySetInnerHTML={{
            __html: `
              document.addEventListener('click', function (event) {
                if (window.location.pathname !== '/my-games') return;
                var target = event.target;
                if (!(target instanceof Element)) return;
                var button = target.closest('button');
                if (!(button instanceof HTMLButtonElement)) return;
                var label = (button.textContent || '').trim().toLowerCase();
                if (!label.includes('delete') && !label.includes('삭제')) return;
                var message = document.documentElement.lang === 'ko' ? '이 항목을 삭제할까요?' : 'Delete this item?';
                if (!window.confirm(message)) {
                  event.preventDefault();
                  event.stopPropagation();
                }
              }, true);
            `
        }}/>
      </body>
    </html>);
}
