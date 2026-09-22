import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Icon, type IconName } from '../Icon';
import { Avatar } from '../ui/Avatar';
import { useAuth } from '@/state/AuthContext';
import { useTheme } from '@/state/ThemeContext';
import { cx } from '@/lib/utils';

interface NavItem {
  to: string;
  label: string;
  icon: IconName;
}

const NAV: NavItem[] = [
  { to: '/dashboard', label: 'Home', icon: 'home' },
  { to: '/practice', label: 'Practice', icon: 'grid' },
  { to: '/history', label: 'History', icon: 'clock' },
];

/** Top navigation bar — the web-native replacement for the mobile tab bar. */
export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { displayName, profileImageUrl } = useAuth();
  const theme = useTheme();
  const onProfile =
    location.pathname === '/profile' || location.pathname.startsWith('/profile/');

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <button className="navbar__brand" onClick={() => navigate('/dashboard')} aria-label="Qlue home">
          Qlue<span>AI</span>
        </button>

        <nav className="navbar__links" aria-label="Primary">
          {NAV.map((n) => {
            const active =
              location.pathname === n.to || location.pathname.startsWith(n.to + '/');
            return (
              <NavLink
                key={n.to}
                to={n.to}
                className={cx('navbar__link', active && 'navbar__link--active')}
                aria-current={active ? 'page' : undefined}
              >
                <Icon name={n.icon} size={18} strokeWidth={active ? 2.4 : 2} />
                <span>{n.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="navbar__actions">
          <button
            className="icon-btn"
            onClick={theme.toggle}
            aria-label={theme.isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <Icon name={theme.isDark ? 'sun' : 'moon'} size={20} />
          </button>
          <button
            className={cx('navbar__profile', onProfile && 'navbar__profile--active')}
            onClick={() => navigate('/profile')}
            aria-label="Profile"
            aria-current={onProfile ? 'page' : undefined}
          >
            <Avatar name={displayName} src={profileImageUrl} size={34} />
          </button>
        </div>
      </div>
    </header>
  );
}
