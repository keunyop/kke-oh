import { ClosableDetails } from '@/app/_components/closable-details';
import { CurrentPageLoginLink } from '@/app/_components/current-page-login-link';
import { getCurrentUser } from '@/lib/auth';
import { getDictionary, type Locale } from '@/lib/i18n';
import { getUserPointBalance } from '@/lib/points/service';
import { isAdminUser } from '@/lib/security/admin';

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

export async function SiteNavbar({ search = '', locale }: NavbarProps) {
  const user = await getCurrentUser();
  const adminUser = isAdminUser(user);
  const pointBalance = user ? await getUserPointBalance(user.id).catch(() => 0) : null;
  const t = getDictionary(locale);
  const profileMenuLabel = 'Profile menu';
  const navigationMenuLabel = 'Open menu';
  const mobileMenuText = locale === 'ko' ? '메뉴' : 'Menu';
  const logoutLabel = t.common.logout;
  const myGamesLabel = locale === 'ko' ? '내 게임' : 'My Games';
  const pointsLabel = locale === 'ko' ? '포인트' : 'Points';
  const adminLabel = locale === 'ko' ? '관리자' : 'Admin';
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
            <input type="search" name="q" placeholder={t.common.searchPlaceholder} defaultValue={search} aria-label={t.common.searchPlaceholder} />
          </form>
          <a href="/submit" className="upload-link">
            {t.common.uploadGame}
          </a>
          {user ? (
            <>
              <a href="/points" className="profile-pill profile-points-pill">
                {pointsLabel} {pointBalance ?? 0}
              </a>
              <ClosableDetails
                className="profile-menu"
                summary={
                  <summary className="profile-avatar" aria-label={profileMenuLabel}>
                    <span>{getAvatarText(user.loginId)}</span>
                  </summary>
                }
              >
                <div className="profile-menu-card">
                  <p className="profile-menu-name">{user.loginId}</p>
                  <a href="/points" className="profile-menu-link">
                    {pointsLabel} {pointBalance ?? 0}
                  </a>
                  {adminUser ? (
                    <a href="/admin" className="profile-menu-link">
                      {adminLabel}
                    </a>
                  ) : null}
                  <a href="/my-games" className="profile-menu-link">
                    {myGamesLabel}
                  </a>
                  <form action="/api/auth/logout" method="post">
                    <button type="submit" className="profile-menu-button">
                      {logoutLabel}
                    </button>
                  </form>
                </div>
              </ClosableDetails>
            </>
          ) : (
            <CurrentPageLoginLink className="profile-pill">{t.common.login}</CurrentPageLoginLink>
          )}
        </div>

        <ClosableDetails
          className="mobile-nav"
          summary={
            <summary className="mobile-nav-toggle" aria-label={navigationMenuLabel}>
              <span className="mobile-nav-toggle-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" className="mobile-nav-toggle-svg">
                  <path d="M8 7.25h8.2a2.55 2.55 0 1 1 0 5.1H8a2.55 2.55 0 1 1 0-5.1zm0 0A2.55 2.55 0 1 0 8 12.35" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M15.7 11.65H7.8a2.55 2.55 0 1 0 0 5.1h7.9a2.55 2.55 0 1 0 0-5.1zm0 0a2.55 2.55 0 1 1 0 5.1" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="mobile-nav-toggle-text">{mobileMenuText}</span>
            </summary>
          }
        >
          <div className="mobile-nav-panel">
            <form action="/" className="nav-search mobile-nav-search" role="search">
              <input type="search" name="q" placeholder={t.common.searchPlaceholder} defaultValue={search} aria-label={t.common.searchPlaceholder} />
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
                <a href="/points" className="profile-menu-link mobile-nav-link">
                  {pointsLabel} {pointBalance ?? 0}
                </a>
                {adminUser ? (
                  <a href="/admin" className="profile-menu-link mobile-nav-link">
                    {adminLabel}
                  </a>
                ) : null}
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
              <CurrentPageLoginLink className="profile-pill mobile-nav-link">{t.common.login}</CurrentPageLoginLink>
            )}
          </div>
        </ClosableDetails>
      </div>
    </header>
  );
}
