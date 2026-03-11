import { getCurrentUser } from '@/lib/auth';
import { getDictionary, type Locale } from '@/lib/i18n';

type NavbarProps = {
  search?: string;
  locale: Locale;
};

function getAvatarText(loginId: string) {
  const initials = loginId
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return initials || loginId.slice(0, 1).toUpperCase();
}

export async function Navbar({ search = '', locale }: NavbarProps) {
  const user = await getCurrentUser();
  const t = getDictionary(locale);
  const profileMenuLabel = 'Profile menu';
  const navigationMenuLabel = 'Open menu';
  const logoutLabel = t.common.logout;
  const myGamesLabel = locale === 'ko' ? '나의 게임' : 'My Games';
  const mobileUserLabel = locale === 'ko' ? '로그인 중' : 'Signed in';

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

        <div className="nav-actions simple-actions nav-actions-desktop">
          <form action="/" className="nav-search" role="search">
            <input
              type="search"
              name="q"
              placeholder={t.common.searchPlaceholder}
              defaultValue={search}
              aria-label={t.common.searchPlaceholder}
            />
          </form>
          <a href="/submit" className="upload-link">
            {t.common.uploadGame}
          </a>
          {user ? (
            <details className="profile-menu">
              <summary className="profile-avatar" aria-label={profileMenuLabel}>
                <span>{getAvatarText(user.loginId)}</span>
              </summary>
              <div className="profile-menu-card">
                <p className="profile-menu-name">{user.loginId}</p>
                <a href="/my-games" className="profile-menu-link">
                  {myGamesLabel}
                </a>
                <form action="/api/auth/logout" method="post">
                  <button type="submit" className="profile-menu-button">
                    {logoutLabel}
                  </button>
                </form>
              </div>
            </details>
          ) : (
            <a href="/login?next=/submit" className="profile-pill">
              {t.common.login}
            </a>
          )}
        </div>

        <details className="mobile-nav">
          <summary className="mobile-nav-toggle" aria-label={navigationMenuLabel}>
            <span className="mobile-nav-toggle-line" aria-hidden="true" />
            <span className="mobile-nav-toggle-line" aria-hidden="true" />
            <span className="mobile-nav-toggle-line" aria-hidden="true" />
          </summary>
          <div className="mobile-nav-panel">
            <form action="/" className="nav-search mobile-nav-search" role="search">
              <input
                type="search"
                name="q"
                placeholder={t.common.searchPlaceholder}
                defaultValue={search}
                aria-label={t.common.searchPlaceholder}
              />
            </form>
            <a href="/submit" className="upload-link mobile-nav-link">
              {t.common.uploadGame}
            </a>
            {user ? (
              <div className="mobile-profile-card">
                <div className="mobile-profile-head">
                  <span className="profile-avatar mobile-profile-avatar" aria-hidden="true">
                    <span>{getAvatarText(user.loginId)}</span>
                  </span>
                  <div className="mobile-profile-copy">
                    <p className="mobile-profile-label">{mobileUserLabel}</p>
                    <p className="mobile-profile-name">{user.loginId}</p>
                  </div>
                </div>
                <a href="/my-games" className="profile-menu-link mobile-nav-link">
                  {myGamesLabel}
                </a>
                <form action="/api/auth/logout" method="post">
                  <button type="submit" className="profile-menu-button">
                    {logoutLabel}
                  </button>
                </form>
              </div>
            ) : (
              <a href="/login?next=/submit" className="profile-pill mobile-nav-link">
                {t.common.login}
              </a>
            )}
          </div>
        </details>
      </div>
    </header>
  );
}
