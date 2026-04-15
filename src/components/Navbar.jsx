import { useMemo, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useClerkCompat as useClerk, useUserCompat as useUser } from '../lib/clerkCompat';
import { useAuth } from '../context/AuthContext';
import { BASE_URL } from '../services/apiClient';
import { getDefaultRouteForUser } from '../utils/authStorage';

const studentLinks = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Problems', to: '/problems' },
  { label: 'Progress', to: '/progress' },
  { label: 'Tests', to: '/student-tests' },
  { label: 'Profile', to: '/profile' },
  { label: 'Settings', to: '/settings' },
];

const instituteLinks = [
  { label: 'Dashboard', to: '/institute-dashboard' },
  { label: 'Create Test', to: '/create-test' },
  { label: 'Analytics', to: '/institute-analytics' },
  { label: 'Settings', to: '/settings' },
];

function buildInitials(name) {
  if (!name) {
    return 'CM';
  }

  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function toAbsoluteImageUrl(imagePath) {
  if (!imagePath) {
    return '';
  }

  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  return `${BASE_URL}${imagePath}`;
}

function Navbar() {
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { user: clerkUser } = useUser();
  const { signOut } = useClerk();
  const [menuOpen, setMenuOpen] = useState(false);
  const isHomePage = location.pathname === '/';
  const dashboardRoute = getDefaultRouteForUser(user);
  const accountRoute = user?.role === 'institute' ? '/settings' : '/profile';
  const displayName = clerkUser?.fullName || user?.name;
  const initials = buildInitials(displayName);
  const avatarImage =
    clerkUser?.imageUrl ||
    (user?.role === 'student' ? toAbsoluteImageUrl(user?.profile_image) : '');

  const navLinks = useMemo(() => {
    if (!isAuthenticated) {
      return [];
    }

    return user?.role === 'institute' ? instituteLinks : studentLinks;
  }, [isAuthenticated, user?.role]);

  // Explicit Clerk sign-out keeps auth termination centralized and redirects to sign-in.
  const handleSignOut = async () => {
    await signOut({ redirectUrl: '/login' });
  };

  const isPublicNavbar = isHomePage || !isAuthenticated;

  if (isPublicNavbar) {
    return (
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-slate-950/55 backdrop-blur-2xl">
        <div className="mx-auto flex h-[4.75rem] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            to={isAuthenticated ? dashboardRoute : '/'}
            className="inline-flex items-center gap-3 text-xl font-bold tracking-tight text-white"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-secondary/35 to-brand-accent/30 text-sm text-brand-accent shadow-[0_12px_30px_rgba(73,113,255,0.22)]">
              C
            </span>
            Code<span className="text-brand-accent">Mitra</span>
          </Link>

          <div className="hidden items-center gap-3 md:flex">
            {isAuthenticated ? (
              <>
                <Link
                  to={dashboardRoute}
                  className="rounded-xl border border-white/12 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
                >
                  Go to Dashboard
                </Link>
                <Link
                  to={accountRoute}
                  className="inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-white/12 bg-white/5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
                >
                  {avatarImage ? (
                    <img
                      src={avatarImage}
                      alt={displayName || 'Profile'}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="rounded-xl border border-white/12 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-xl border border-white/12 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="rounded-xl bg-gradient-to-r from-brand-accent to-brand-accentSoft px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_12px_28px_rgba(34,198,163,0.24)] transition hover:-translate-y-0.5 hover:brightness-105"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            className="inline-flex items-center rounded-xl border border-white/10 px-3 py-2 text-sm text-white transition hover:bg-white/10 md:hidden"
            onClick={() => setMenuOpen((previous) => !previous)}
            aria-label="Toggle navigation"
          >
            Menu
          </button>
        </div>

        {menuOpen ? (
          <div className="border-t border-white/10 bg-slate-950/90 px-4 py-4 md:hidden">
            <div className="flex flex-col gap-2">
              {isAuthenticated ? (
                <>
                  <Link
                    to={dashboardRoute}
                    onClick={() => setMenuOpen(false)}
                    className="rounded-xl px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to={accountRoute}
                    onClick={() => setMenuOpen(false)}
                    className="rounded-xl px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
                  >
                    {user?.role === 'institute' ? 'Settings' : 'Profile'}
                  </Link>
                  <button
                    type="button"
                    onClick={async () => {
                      setMenuOpen(false);
                      await handleSignOut();
                    }}
                    className="rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-200 transition hover:bg-white/10"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-xl px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-xl bg-gradient-to-r from-brand-accent to-brand-accentSoft px-3 py-2 text-center text-sm font-semibold text-slate-950"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        ) : null}
      </header>
    );
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-brand-border/45 bg-brand-bg/70 shadow-[0_8px_28px_rgba(5,11,28,0.35)] backdrop-blur-xl">
      <div className="mx-auto flex h-[4.5rem] max-w-[90rem] items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          to={dashboardRoute}
          className="group inline-flex items-center gap-2 text-xl font-bold tracking-tight text-brand-text transition hover:opacity-95"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-accent/20 text-sm text-brand-accent shadow-glow">
            C
          </span>
          Code<span className="text-brand-accent">Mitra</span>
        </Link>

        <nav className="hidden items-center gap-2 rounded-full border border-brand-border/70 bg-brand-surface/55 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] md:flex">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `pill-link ${
                  isActive
                    ? 'bg-brand-elevated text-brand-text shadow-[0_8px_20px_rgba(10,20,45,0.45)]'
                    : ''
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-xl border border-brand-border bg-brand-elevated px-4 py-2.5 text-sm font-semibold text-brand-text shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-secondary/70 hover:shadow-glow"
          >
            Logout
          </button>
          <Link
            to={accountRoute}
            className="inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-brand-border bg-brand-elevated text-sm font-semibold text-brand-text shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-secondary/70 hover:shadow-glow"
            aria-label="Open profile"
          >
            {avatarImage ? (
              <img
                src={avatarImage}
                alt={displayName || 'Profile'}
                className="h-full w-full object-cover"
              />
            ) : (
              initials
            )}
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex items-center rounded-lg border border-brand-border px-3 py-2 text-sm text-brand-text transition hover:bg-brand-elevated/80 md:hidden"
          onClick={() => setMenuOpen((previous) => !previous)}
          aria-label="Toggle navigation"
        >
          Menu
        </button>
      </div>

      {menuOpen ? (
        <div className="border-t border-brand-border/70 bg-brand-surface/95 px-4 py-3 md:hidden">
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `rounded-xl px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-brand-elevated text-brand-text'
                      : 'text-brand-muted hover:bg-brand-elevated/80 hover:text-brand-text'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            <button
              type="button"
              onClick={async () => {
                setMenuOpen(false);
                await handleSignOut();
              }}
              className="rounded-xl px-3 py-2 text-left text-sm font-medium text-brand-muted transition hover:bg-brand-elevated/80 hover:text-brand-text"
            >
              Logout
            </button>
          </div>
        </div>
      ) : null}
    </header>
  );
}

export default Navbar;
