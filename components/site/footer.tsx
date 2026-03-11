import { LocaleSwitcher } from '@/components/site/locale-switcher';
import type { Locale } from '@/lib/i18n';

export function Footer({ locale }: { locale: Locale }) {
  const copy =
    locale === 'ko'
      ? {
          brand: '작은 웹게임을 발견하고 직접 만든 게임을 나누는 공간입니다.',
          about: '소개',
          upload: '게임 만들기',
          safety: '안전',
          contact: '문의',
          terms: '이용약관'
        }
      : {
          brand: 'A welcoming place to discover small web games and share what you made.',
          about: 'About',
          upload: 'Create',
          safety: 'Safety',
          contact: 'Contact',
          terms: 'Terms'
        };

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div>
          <p className="footer-brand">KKE-OH!</p>
          <p className="footer-copy">{copy.brand}</p>
        </div>
        <div className="footer-actions">
          <nav className="footer-links" aria-label="Footer">
            <a href="/">{copy.about}</a>
            <a href="/submit">{copy.upload}</a>
            <a href="/#safety">{copy.safety}</a>
            <a href="/#contact">{copy.contact}</a>
            <a href="/#terms">{copy.terms}</a>
          </nav>
          <LocaleSwitcher locale={locale} />
        </div>
      </div>
    </footer>
  );
}
