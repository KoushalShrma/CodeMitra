import { Bell, ChevronDown, LogOut, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from '../ui/ThemeToggle';
import { useUserCompat as useUser } from '../../lib/clerkCompat';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { SessionTimer } from './SessionTimer';
import { useAuth } from '../../context/AuthContext';

/**
 * Top navigation bar with smart compact mode, search, quick actions, and user menu.
 * @param {{onOpenCommandPalette: () => void, onOpenShortcuts: () => void}} props Navbar props.
 * @returns {JSX.Element} Top navbar.
 */
export function Navbar({ onOpenCommandPalette, onOpenShortcuts }) {
  const { user, logoutUser } = useAuth();
  const { user: clerkUser } = useUser();
  const navigate = useNavigate();
  const [compact, setCompact] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setCompact(window.scrollY > 48);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const displayName = useMemo(
    () => clerkUser?.fullName || user?.name || user?.email?.split('@')[0] || 'Learner',
    [clerkUser?.fullName, user?.email, user?.name]
  );

  const imageUrl = useMemo(
    () => clerkUser?.imageUrl || user?.profile_image || '',
    [clerkUser?.imageUrl, user?.profile_image]
  );

  return (
    <header className={`topbar-shell ${compact ? 'topbar-compact' : ''}`}>
      <div className="topbar-inner">
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}
        >
          <button
            type="button"
            className="search-shell"
            onClick={onOpenCommandPalette}
            aria-label="Open command palette"
          >
            <Search size={15} color="var(--color-text-secondary)" />
            <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
              Search problems, pages, actions
            </span>
            <span className="command-kbd">Ctrl K</span>
          </button>
          <SessionTimer />
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            justifySelf: 'end',
          }}
        >
          <Button
            variant="ghost"
            ariaLabel="Open notifications"
            className="ui-button"
            style={{ width: 38, height: 38, padding: 0 }}
          >
            <Bell size={16} />
          </Button>

          <ThemeToggle />

          <Button variant="ghost" onClick={onOpenShortcuts} ariaLabel="Open keyboard shortcuts">
            ?
          </Button>

          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className="ui-button ui-button-secondary"
              style={{ paddingRight: 'var(--space-2)' }}
              onClick={() => setMenuOpen((current) => !current)}
              aria-label="Open user menu"
              aria-expanded={menuOpen}
            >
              <Avatar name={displayName} imageUrl={imageUrl} size={30} />
              <span
                style={{
                  maxWidth: 160,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {displayName}
              </span>
              <ChevronDown size={14} />
            </button>

            {menuOpen ? (
              <div
                className="surface-card"
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + var(--space-2))',
                  minWidth: 180,
                  padding: 'var(--space-2)',
                  zIndex: 40,
                }}
              >
                <div style={{ marginBottom: 'var(--space-2)' }}>
                  <button
                    type="button"
                    className="ui-button ui-button-ghost"
                    style={{ width: '100%', justifyContent: 'flex-start' }}
                    onClick={() => {
                      setMenuOpen(false);
                      navigate('/profile');
                    }}
                  >
                    Profile
                  </button>
                </div>
                <div style={{ marginBottom: 'var(--space-2)' }}>
                  <button
                    type="button"
                    className="ui-button ui-button-ghost"
                    style={{ width: '100%', justifyContent: 'flex-start' }}
                    onClick={() => {
                      setMenuOpen(false);
                      navigate('/settings');
                    }}
                  >
                    Settings
                  </button>
                </div>
                <div>
                  <button
                    type="button"
                    className="ui-button ui-button-danger"
                    style={{ width: '100%', justifyContent: 'flex-start' }}
                    onClick={async () => {
                      setMenuOpen(false);
                      await logoutUser();
                    }}
                  >
                    <LogOut size={14} />
                    Logout
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}

Navbar.propTypes = {
  onOpenCommandPalette: PropTypes.func.isRequired,
  onOpenShortcuts: PropTypes.func.isRequired,
};
