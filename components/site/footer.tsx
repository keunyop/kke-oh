import { LocaleSwitcher } from '@/components/site/locale-switcher';
import type { Locale } from '@/lib/i18n';

export function Footer({ locale }: { locale: Locale }) {
  const copy =
    locale === 'ko'
      ? {
          brand: '\uC791\uC740 \uC6F9\uAC8C\uC784\uC744 \uBC1C\uACAC\uD558\uACE0 \uC9C1\uC811 \uB9CC\uB4E0 \uAC8C\uC784\uC744 \uB098\uB204\uB294 \uACF5\uAC04\uC785\uB2C8\uB2E4.',
          about: '\uC18C\uAC1C',
          upload: '\uAC8C\uC784 \uB9CC\uB4E4\uAE30',
          safety: '\uC548\uC804',
          contact: '\uBB38\uC758',
          terms: '\uC774\uC6A9\uADDC\uCE59'
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
