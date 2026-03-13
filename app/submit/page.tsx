import { requireUser } from '@/lib/auth';
import { getDictionary, type Locale } from '@/lib/i18n';
import { getRequestLocale } from '@/lib/i18n/server';
import SubmitForm from './submit-form';

function getHowItWorksCopy(locale: Locale) {
  return locale === 'ko'
    ? {
        title: '어떻게 만들어요?',
        steps: [
          '1. 먼저 게임 이름을 정해요.',
          '2. AI로 만들지, 파일을 올릴지 고르면 돼요.',
          '3. 만들기가 끝나면 바로 게임 링크가 나와요.'
        ]
      }
    : {
        title: 'How it works',
        steps: [
          '1. Pick a game name first.',
          '2. Choose AI or upload your own files.',
          '3. When it is ready, your game link appears right away.'
        ]
      };
}

export default async function SubmitPage() {
  const locale = getRequestLocale();
  await requireUser('/submit');
  const t = getDictionary(locale);
  const howItWorks = getHowItWorksCopy(locale);

  return (
    <div className="upload-page">
      <section className="upload-hero upload-hero-simple">
        <div>
          <h1>{t.upload.pageTitle}</h1>
          <p>{t.upload.pageDescription}</p>
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