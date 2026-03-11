import { redirect } from 'next/navigation';
import LoginForm from './login-form';
import { getCurrentUser } from '@/lib/auth';

export default async function LoginPage({
  searchParams
}: {
  searchParams?: {
    next?: string;
  };
}) {
  const user = await getCurrentUser();
  const nextPath = searchParams?.next?.startsWith('/') ? searchParams.next : '/';

  if (user) {
    redirect(nextPath);
  }

  return (
    <section className="auth-page">
      <div className="auth-hero panel-card">
        <span className="pill-label">KKE-OH!</span>
        <h1>아이도 쉽게 시작하는 게임 놀이터</h1>
        <p>로그인하면 게임을 올리고, 친구들이 만든 작품도 함께 즐길 수 있어요.</p>
        <ul className="upload-rules">
          <li>ID와 비밀번호만 있으면 바로 시작할 수 있어요.</li>
          <li>회원가입은 1분도 걸리지 않아요.</li>
          <li>로그인하면 게임 올리기 버튼이 열려요.</li>
        </ul>
      </div>
      <LoginForm nextPath={nextPath} />
    </section>
  );
}
