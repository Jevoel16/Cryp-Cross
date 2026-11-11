import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <img src="/img/logo-72.webp" width="25" height="36" alt="" loading="lazy" />
          <strong>Cryp-Cross</strong>
        </div>
        <nav className="footer-links" aria-label="Footer">
          <Link to="/play">Play</Link>
          <Link to="/leaderboard">Leaderboard</Link>
          <Link to="/puzzles">Archive</Link>
          <Link to="/idea">How it works</Link>
          <Link to="/team">Team</Link>
        </nav>
        <p className="footer-credit">
          &copy; {new Date().getFullYear()} Cryp-Cross by{' '}
          <a href="https://github.com/Jevoel16" rel="noopener noreferrer">
            Sprucetrap
          </a>
        </p>
      </div>
    </footer>
  );
}
