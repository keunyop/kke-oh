import { requireUser } from '@/lib/auth';
import { getRequestLocale } from '@/lib/i18n/server';
import SubmitForm from './submit-form';

function getHowItWorksCopy(locale: ReturnType<typeof getRequestLocale>) {
  if (locale === 'ko') {
    return {
      title: '사용 방법',
      steps: ['1. 게임 이름을 적어요.', '2. AI로 만들거나 파일을 올려요.', '3. 준비가 끝나면 바로 게임 주소를 확인해요.']
    };
  }

  return {
    title: 'How it works',
    steps: ['1. Pick a game name.', '2. Build it with AI or upload your files.', '3. Your game link appears when it is ready.']
  };
}

export default async function SubmitPage() {
  const locale = getRequestLocale();
  await requireUser('/submit');
  const howItWorks = getHowItWorksCopy(locale);

  return (
    <div className="upload-page">
      <section className="upload-hero upload-hero-simple">
        <div>
          <h1>{locale === 'ko' ? '게임 만들기' : 'Create Game'}</h1>
          <p>
            {locale === 'ko'
              ? '직접 만든 파일을 올리거나 AI에게 부탁해서 새 게임을 만들 수 있어요.'
              : 'Upload your own files or ask AI to help make a new game.'}
          </p>
          <div className="submit-how-it-works">
            <strong>{howItWorks.title}</strong>
            <ul className="upload-rules submit-rules-simple">
              {howItWorks.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>
      <SubmitForm locale={locale} />
    </div>
  );
}

