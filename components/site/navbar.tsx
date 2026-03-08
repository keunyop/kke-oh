type NavbarProps = {
  search?: string;
};

export function Navbar({ search = '' }: NavbarProps) {
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
            <input type="search" name="q" placeholder="Search games" defaultValue={search} aria-label="Search games" />
          </form>
          <a href="/submit" className="upload-link">
            Upload Game
          </a>
          <a href="/admin" className="profile-pill">
            Login
          </a>
        </div>
      </div>
    </header>
  );
}
