import { requireUser } from '@/lib/auth';
import SubmitForm from './submit-form';

export default async function SubmitPage() {
  const user = await requireUser('/submit');

  return (
    <div className="upload-page">
      <section className="upload-hero">
        <div>
          <span className="pill-label">Upload Game</span>
          <h1>내 게임 올리기</h1>
          <p>어렵지 않아요. 게임 이름, 설명, HTML만 넣으면 바로 올릴 수 있어요.</p>
        </div>
        <div className="upload-hero-panel">
          <strong>{user.loginId} 님으로 로그인 중</strong>
          <p>HTML을 바로 붙여넣거나 ZIP 파일로 올릴 수 있어요. 썸네일은 있으면 더 좋아요.</p>
        </div>
      </section>
      <SubmitForm userLoginId={user.loginId} />
    </div>
  );
}
