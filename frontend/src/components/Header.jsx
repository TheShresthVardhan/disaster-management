import { NavLink } from 'react-router-dom';
import { Button } from '../components/ui';
import { useTheme } from '../context/ThemeContext';
import './Header.css';

const navItems = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/report', label: 'Report Incident', icon: '📝' },
  { path: '/alerts', label: 'Alerts', icon: '🚨' },
  { path: '/safety', label: 'Safety Info', icon: '📚' },
  { path: '/sos', label: 'Emergency SOS', icon: '🆘' },
];

function Header() {
  const { theme, toggleTheme, mounted } = useTheme();

  return (
    <header className="app-header" role="banner">
      <nav className="navbar navbar-expand-lg" aria-label="Main navigation">
        <div className="container-fluid px-3 px-md-4">
          <NavLink to="/" className="navbar-brand d-flex align-items-center gap-2" aria-label="Disastell Home">
            <img src="/disastell-icon.png" alt="Disastell logo" className="brand-logo" />
            <span className="brand-text">Disastell</span>
          </NavLink>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#mainNav"
            aria-controls="mainNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="mainNav">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              {navItems.map((item) => (
                <li key={item.path} className="nav-item">
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `nav-link d-flex align-items-center gap-2 ${isActive ? 'active' : ''}`
                    }
                    aria-current={item.path === '/' ? 'page' : undefined}
                  >
                    <span className="nav-icon" aria-hidden="true">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
            <div className="d-flex align-items-center gap-2 ms-auto">
              {mounted && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleTheme}
                  aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                  title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                >
                  {theme === 'light' ? '🌙' : '☀️'}
                </Button>
              )}
              <Button variant="ghost" size="sm" as="a" href="/alerts">
                Subscribe
              </Button>
              <Button variant="primary" size="sm" as="a" href="/report">
                Report Incident
              </Button>
            </div>
          </div>
        </div>
      </nav>
      <div className="header-divider" role="separator" aria-hidden="true"></div>
    </header>
  );
}

export default Header;