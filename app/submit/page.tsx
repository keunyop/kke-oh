import { requireUser } from '@/lib/auth';
import { getRequestLocale } from '@/lib/i18n/server';
import SubmitForm from './submit-form';

export default async function SubmitPage() {
  const locale = getRequestLocale();
  const user = await requireUser('/submit');
  const copy =
    locale === 'ko'
      ? {
          title: '내 게임 올리기',
          description: '게임 제목과 설명을 적고 HTML 파일이나 ZIP 파일을 올리면 바로 공개할 수 있습니다.',
          loginAs: '로그인',
          easyFlow: 'HTML 파일 1개를 올리거나, HTML이 들어 있는 ZIP 파일을 올릴 수 있습니다. 썸네일은 선택입니다.'
        }
      : {
          title: 'Upload My Game',
          description: 'Add a title and description, then upload either an HTML file or a ZIP package.',
          loginAs: 'Logged in as',
          easyFlow: 'You can upload a single HTML file or a ZIP that includes HTML files. A thumbnail is optional.'
        };

  return (
    <div className="upload-page">
      <section className="upload-hero">
        <div>
          <span className="pill-label">Upload Game</span>
          <h1>{copy.title}</h1>
          <p>{copy.description}</p>
        </div>
        <div className="upload-hero-panel">
          <strong>
            {copy.loginAs}: {user.loginId}
          </strong>
          <p>{copy.easyFlow}</p>
        </div>
      </section>
      <SubmitForm userLoginId={user.loginId} locale={locale} />
    </div>
  );
}
