import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getRequestLocale } from '@/lib/i18n/server';
import LoginFormClient from '@/login-form-client';

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
      <LoginFormClient nextPath={nextPath} locale={locale} />
    </section>
  );
}

