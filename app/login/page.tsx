import { redirect } from 'next/navigation';
import LoginForm from './login-form';
import { getCurrentUser } from '@/lib/auth';
import { getDictionary } from '@/lib/i18n';
import { getRequestLocale } from '@/lib/i18n/server';

export default async function LoginPage({
  searchParams
}: {
  searchParams?: {
    next?: string;
  };
}) {
  const user = await getCurrentUser();
  const locale = getRequestLocale();
  const t = getDictionary(locale);
  const nextPath = searchParams?.next?.startsWith('/') ? searchParams.next : '/';

  if (user) {
    redirect(nextPath);
  }

  return (
    <section className="auth-page">
      <div className="auth-hero panel-card">
        <span className="pill-label">{t.common.brand}</span>
        <h1>{t.login.heroTitle}</h1>
        <p>{t.login.heroDescription}</p>
        <ul className="upload-rules">
          <li>{t.login.heroRule1}</li>
          <li>{t.login.heroRule2}</li>
          <li>{t.login.heroRule3}</li>
        </ul>
      </div>
      <LoginForm nextPath={nextPath} locale={locale} />
    </section>
  );
}
