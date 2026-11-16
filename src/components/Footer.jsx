import { NavLink } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <nav className="footer-links" aria-label="About Cryp-Cross">
          <NavLink to="/idea">How it works</NavLink>
          <NavLink to="/team">Team</NavLink>
          <NavLink to="/accessibility">Accessibility</NavLink>
        </nav>
        <p className="footer-credit">
          Built by <a href="https://github.com/Jevoel16">Sprucetrap</a>.{' '}
          <a href="https://github.com/Jevoel16/Cryp-Cross/blob/main/LICENSE">License</a>
        </p>
      </div>
    </footer>
  );
}
