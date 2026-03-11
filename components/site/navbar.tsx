import { getCurrentUser } from '@/lib/auth';

type NavbarProps = {
  search?: string;
};

export async function Navbar({ search = '' }: NavbarProps) {
  const user = await getCurrentUser();

  return (
    <header className="site-header">
      <div className="site-header-inner simple-header">
        <a href="/" className="brand-mark brand-logo" aria-label="KKE-OH! home">
          <span className="brand-orbit" aria-hidden="true">
            <span className="brand-orbit-core" />
          </span>
          <span className="brand-text">
            <strong>KKE-OH!</strong>
          </span>
        </a>

        <div className="nav-actions simple-actions">
          <form action="/" className="nav-search" role="search">
            <input type="search" name="q" placeholder="게임 찾기" defaultValue={search} aria-label="게임 찾기" />
          </form>
          <a href="/submit" className="upload-link">
            게임 올리기
          </a>
          {user ? (
            <>
              <span className="profile-pill profile-name">{user.loginId}</span>
              <form action="/api/auth/logout" method="post">
                <button type="submit" className="profile-pill nav-button">
                  로그아웃
                </button>
              </form>
            </>
          ) : (
            <a href="/login?next=/submit" className="profile-pill">
              로그인
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
