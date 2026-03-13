import { requireUser } from '@/lib/auth';
import { getDictionary } from '@/lib/i18n';
import { getRequestLocale } from '@/lib/i18n/server';
import SubmitForm from './submit-form';
export default async function SubmitPage() {
    const locale = getRequestLocale();
    const user = await requireUser('/submit');
    const t = getDictionary(locale);
    const modeSummary = locale === 'ko'
        ? 'AI로 새 게임을 만들거나, 직접 만든 HTML 또는 ZIP 패키지를 등록할 수 있어요.'
        : 'Create a new game with AI or publish your own HTML and ZIP packages.';
    return (<div className="upload-page">
      <section className="upload-hero">
        <div>
          <span className="pill-label">{t.common.uploadGame}</span>
          <h1>{t.upload.pageTitle}</h1>
          <p>{t.upload.pageDescription}</p>
        </div>
        <div className="upload-hero-panel">
          <strong>
            {t.upload.loginAs}: {user.loginId}
          </strong>
          <p>{t.upload.easyFlow}</p>
          <p>{modeSummary}</p>
        </div>
      </section>
      <SubmitForm userLoginId={user.loginId} locale={locale}/>
    </div>);
}
