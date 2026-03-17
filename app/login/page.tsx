import { redirect } from 'next/navigation';
import LoginForm from './login-form';
import { getCurrentUser } from '@/lib/auth';
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
  const nextPath = searchParams?.next?.startsWith('/') ? searchParams.next : '/';

  if (user) {
    redirect(nextPath);
  }

  return (
    <section className="auth-page auth-page-centered">
      <LoginForm nextPath={nextPath} locale={locale} />
    </section>
  );
}

