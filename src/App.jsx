import { SignedIn, SignedOut } from '@clerk/clerk-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  BarChart3,
  BookOpen,
  Building2,
  Code2,
  FlaskConical,
  LayoutDashboard,
  Settings as SettingsIcon,
  Trophy,
  User,
} from 'lucide-react';
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import InstitutionProtectedRoute from './components/InstitutionProtectedRoute';
import ProtectedRoute from './components/ProtectedRoute';
import { CommandPalette } from './components/layout/CommandPalette';
import { Navbar } from './components/layout/Navbar';
import { RouteSkeleton } from './components/layout/RouteSkeleton';
import { ShortcutOverlay } from './components/layout/ShortcutOverlay';
import { Sidebar } from './components/layout/Sidebar';
import { useAuth } from './context/AuthContext';
import { practiceProblems } from './data/practiceProblems';
import { useDebouncedPreferenceSave } from './hooks/useDebouncedPreferenceSave';
import { useTheme } from './hooks/useTheme';
import { getDefaultRouteForUser } from './utils/authStorage';
import { clearInstitutionSession, getInstitutionSessionToken } from './utils/institutionSession';

const About = lazy(() => import('./pages/About'));
const AuthEntryPage = lazy(() => import('./pages/AuthEntryPage'));
const Contests = lazy(() => import('./pages/Contests'));
const CreateTestPage = lazy(() => import('./pages/CreateTestPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Editor = lazy(() => import('./pages/Editor'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const HomePage = lazy(() => import('./pages/HomePage'));
const InstituteAnalyticsPage = lazy(() => import('./pages/InstituteAnalyticsPage'));
const InstituteDashboard = lazy(() => import('./pages/InstituteDashboard'));
const InstitutionJoinPage = lazy(() => import('./pages/InstitutionJoinPage'));
const InstitutionLoginPage = lazy(() => import('./pages/InstitutionLoginPage'));
const InstitutionMembersPage = lazy(() => import('./pages/InstitutionMembersPage'));
const InstitutionTestLobbyPage = lazy(() => import('./pages/InstitutionTestLobbyPage'));
const InstitutionTestResultsPage = lazy(() => import('./pages/InstitutionTestResultsPage'));
const InstituteSignup = lazy(() => import('./pages/InstituteSignup'));
const Login = lazy(() => import('./pages/Login'));
const ProblemsPage = lazy(() => import('./pages/ProblemsPage'));
const Profile = lazy(() => import('./pages/Profile'));
const ProgressPage = lazy(() => import('./pages/ProgressPage'));
const Services = lazy(() => import('./pages/Services'));
const SettingsPage = lazy(() => import('./pages/Settings'));
const Signup = lazy(() => import('./pages/Signup'));
const StudentTestAttemptPage = lazy(() => import('./pages/StudentTestAttemptPage'));
const StudentTestsPage = lazy(() => import('./pages/StudentTestsPage'));

const PUBLIC_AUTH_ROUTES = new Set(['/login', '/signup', '/forgot-password', '/institute-signup']);
const INSTITUTION_LEGACY_MIRROR_ROUTES = new Set([
  '/institute/login',
  '/institute-dashboard',
  '/create-test',
  '/institute-analytics',
  '/institute-members',
]);

function isTypingTarget(target) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName;
  if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') {
    return true;
  }

  return target.isContentEditable;
}

function LegacyWorkspaceRedirect() {
  const { problemId } = useParams();
  const fallbackId = practiceProblems[0]?.id;

  if (!fallbackId) {
    return <Navigate to="/problems" replace />;
  }

  return <Navigate to={`/editor/${problemId || fallbackId}`} replace />;
}

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();
  const { user, role } = useAuth();
  const { theme, setTheme } = useTheme();
  const { queuePreferencePatch } = useDebouncedPreferenceSave();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isPaletteOpen, setPaletteOpen] = useState(false);
  const [isShortcutsOpen, setShortcutsOpen] = useState(false);
  const [hasHydratedPreferences, setHasHydratedPreferences] = useState(false);

  const defaultRoute = getDefaultRouteForUser(user);
  const firstProblemId = practiceProblems[0]?.id || '';
  const defaultEditorRoute = firstProblemId ? `/editor/${firstProblemId}` : '/problems';
  const isAdminPath = location.pathname.startsWith('/admin');
  const isInstitutionPortalPath =
    (location.pathname.startsWith('/institution/') && location.pathname !== '/institution/join')
    || INSTITUTION_LEGACY_MIRROR_ROUTES.has(location.pathname);
  const isInstitutionLoginPath =
    location.pathname === '/institution/login' || location.pathname === '/institute/login';
  const hasInstitutionSession = Boolean(getInstitutionSessionToken());
  const canAccessInstitutionAttempt = Boolean(user || hasInstitutionSession);
  const isPublicAuthPath = PUBLIC_AUTH_ROUTES.has(location.pathname);
  const overlaysEnabled = Boolean(user) && !isPublicAuthPath;
  const preferredTheme = user?.preferences?.theme_mode;
  const preferredSidebarCollapsed = user?.preferences?.sidebar_collapsed;

  useEffect(() => {
    if (!user?.id) {
      setHasHydratedPreferences(false);
      return;
    }

    if (preferredTheme === 'dark' || preferredTheme === 'light') {
      setTheme(preferredTheme);
    }

    if (typeof preferredSidebarCollapsed === 'boolean') {
      setSidebarCollapsed(preferredSidebarCollapsed);
    }

    setHasHydratedPreferences(true);
  }, [preferredSidebarCollapsed, preferredTheme, setTheme, user?.id]);

  const handleSidebarToggle = useCallback(() => {
    setSidebarCollapsed((current) => {
      const next = !current;
      if (user?.id && hasHydratedPreferences) {
        queuePreferencePatch({ sidebar_collapsed: next });
      }
      return next;
    });
  }, [hasHydratedPreferences, queuePreferencePatch, user?.id]);

  const handleThemeToggle = useCallback(() => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);

    if (user?.id && hasHydratedPreferences) {
      queuePreferencePatch({ theme_mode: nextTheme });
    }
  }, [hasHydratedPreferences, queuePreferencePatch, setTheme, theme, user?.id]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setPaletteOpen(false);
        setShortcutsOpen(false);
        return;
      }

      if (!overlaysEnabled) {
        return;
      }

      const typing = isTypingTarget(event.target);

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen(true);
        return;
      }

      if (!typing && event.key === '?') {
        event.preventDefault();
        setShortcutsOpen(true);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [overlaysEnabled]);

  const sidebarItems = useMemo(() => {
    if (role === 'institute') {
      return [
        { to: '/institution/dashboard', label: 'Dashboard', icon: Building2 },
        { to: '/institution/create-test', label: 'Create Test', icon: FlaskConical },
        { to: '/institution/members', label: 'Members', icon: User },
        { to: '/institution/analytics', label: 'Analytics', icon: BarChart3 },
        { to: '/profile', label: 'Profile', icon: User },
        { to: '/settings', label: 'Settings', icon: SettingsIcon },
      ];
    }

    return [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/problems', label: 'Problems', icon: BookOpen },
      { to: '/editor', label: 'Editor', icon: Code2 },
      { to: '/analytics', label: 'Analytics', icon: BarChart3 },
      { to: '/progress', label: 'Progress', icon: BarChart3 },
      { to: '/contests', label: 'Contests', icon: Trophy },
      { to: '/student-tests', label: 'Tests', icon: FlaskConical },
      { to: '/institution/join', label: 'Join Institution', icon: Building2 },
      { to: '/profile', label: 'Profile', icon: User },
      { to: '/settings', label: 'Settings', icon: SettingsIcon },
    ];
  }, [role]);

  const paletteCommands = useMemo(() => {
    const commands = [
      {
        id: 'go-default',
        title: role === 'institute' ? 'Go to Institute Dashboard' : 'Go to Dashboard',
        hint: defaultRoute,
        run: () => navigate(defaultRoute),
      },
      {
        id: 'go-home',
        title: 'Go to Home',
        hint: '/home',
        run: () => navigate('/home'),
      },
      {
        id: 'go-profile',
        title: 'Open Profile',
        hint: '/profile',
        run: () => navigate('/profile'),
      },
      {
        id: 'go-settings',
        title: 'Open Settings',
        hint: '/settings',
        run: () => navigate('/settings'),
      },
      {
        id: 'toggle-sidebar',
        title: sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar',
        hint: 'Workspace layout',
        run: handleSidebarToggle,
      },
      {
        id: 'toggle-theme',
        title: 'Toggle Theme',
        hint: 'Dark/Light',
        run: handleThemeToggle,
      },
      {
        id: 'open-shortcuts',
        title: 'Show Keyboard Shortcuts',
        hint: '?',
        run: () => setShortcutsOpen(true),
      },
    ];

    if (role === 'student') {
      commands.push(
        {
          id: 'go-problems',
          title: 'Open Problem Catalog',
          hint: '/problems',
          run: () => navigate('/problems'),
        },
        {
          id: 'go-editor',
          title: 'Open Editor Workspace',
          hint: defaultEditorRoute,
          run: () => navigate(defaultEditorRoute),
        },
        {
          id: 'go-progress',
          title: 'Open Progress',
          hint: '/progress',
          run: () => navigate('/progress'),
        },
        {
          id: 'go-analytics',
          title: 'Open Analytics',
          hint: '/analytics',
          run: () => navigate('/analytics'),
        },
        {
          id: 'go-contests',
          title: 'Open Contests',
          hint: '/contests',
          run: () => navigate('/contests'),
        },
        {
          id: 'go-institution-join',
          title: 'Request Institution Access',
          hint: '/institution/join',
          run: () => navigate('/institution/join'),
        }
      );
    }

    if (role === 'institute') {
      commands.push(
        {
          id: 'go-create-test',
          title: 'Create Test',
          hint: '/institution/create-test',
          run: () => navigate('/institution/create-test'),
        },
        {
          id: 'go-institute-analytics',
          title: 'Open Institute Analytics',
          hint: '/institution/analytics',
          run: () => navigate('/institution/analytics'),
        },
        {
          id: 'go-institution-members',
          title: 'Manage Institution Members',
          hint: '/institution/members',
          run: () => navigate('/institution/members'),
        }
      );
    }

    return commands;
  }, [
    defaultEditorRoute,
    defaultRoute,
    handleSidebarToggle,
    handleThemeToggle,
    navigate,
    role,
    sidebarCollapsed,
  ]);

  if (isAdminPath) {
    return (
      <div className="app-shell">
        <a href="#app-main" className="skip-link">
          Skip to main content
        </a>
        <div className="ambient-grid" />

        <main id="app-main" className="page-container">
          <Suspense fallback={<RouteSkeleton />}>
            <Routes>
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route element={<AdminProtectedRoute />}>
                <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/admin/login" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    );
  }

  if (isInstitutionPortalPath) {
    return (
      <div className="app-shell">
        <a href="#app-main" className="skip-link">
          Skip to main content
        </a>
        <div className="ambient-grid" />

        {hasInstitutionSession && !isInstitutionLoginPath ? (
          <section className="page-container" style={{ paddingTop: 'var(--space-4)' }}>
            <div
              className="surface-card"
              style={{
                padding: 'var(--space-3)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 'var(--space-2)',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="ui-button ui-button-ghost"
                  onClick={() => navigate('/institution/dashboard')}
                >
                  Dashboard
                </button>
                <button
                  type="button"
                  className="ui-button ui-button-ghost"
                  onClick={() => navigate('/institution/create-test')}
                >
                  Create Test
                </button>
                <button
                  type="button"
                  className="ui-button ui-button-ghost"
                  onClick={() => navigate('/institution/members')}
                >
                  Members
                </button>
                <button
                  type="button"
                  className="ui-button ui-button-ghost"
                  onClick={() => navigate('/institution/analytics')}
                >
                  Analytics
                </button>
              </div>

              <button
                type="button"
                className="ui-button ui-button-danger"
                onClick={() => {
                  clearInstitutionSession();
                  navigate('/institution/login', { replace: true });
                }}
              >
                Logout
              </button>
            </div>
          </section>
        ) : null}

        <main id="app-main" className="page-container">
          <Suspense fallback={<RouteSkeleton />}>
            <Routes>
              <Route path="/institution/login" element={<InstitutionLoginPage />} />
              <Route path="/institute/login" element={<Navigate to="/institution/login" replace />} />
              <Route
                path="/institution/test/:testId/attempt/:attemptId"
                element={
                  canAccessInstitutionAttempt ? (
                    <StudentTestAttemptPage />
                  ) : (
                    <Navigate to="/institution/login" replace />
                  )
                }
              />
              <Route element={<InstitutionProtectedRoute />}>
                <Route path="/institution/dashboard" element={<InstituteDashboard />} />
                <Route path="/institution/create-test" element={<CreateTestPage />} />
                <Route path="/institution/members" element={<InstitutionMembersPage />} />
                <Route path="/institution/analytics" element={<InstituteAnalyticsPage />} />
                <Route path="/institution/test/:testId/lobby" element={<InstitutionTestLobbyPage />} />
                <Route
                  path="/institution/test/:testId/results"
                  element={<InstitutionTestResultsPage />}
                />
                <Route
                  path="/institute-dashboard"
                  element={<Navigate to="/institution/dashboard" replace />}
                />
                <Route path="/create-test" element={<Navigate to="/institution/create-test" replace />} />
                <Route
                  path="/institute-analytics"
                  element={<Navigate to="/institution/analytics" replace />}
                />
                <Route
                  path="/institute-members"
                  element={<Navigate to="/institution/members" replace />}
                />
              </Route>
              <Route
                path="*"
                element={
                  <Navigate
                    to={hasInstitutionSession ? '/institution/dashboard' : '/institution/login'}
                    replace
                  />
                }
              />
            </Routes>
          </Suspense>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <a href="#app-main" className="skip-link">
        Skip to main content
      </a>
      <div className="ambient-grid" />

      <SignedOut>
        <main id="app-main" className="page-container">
          <section className="page-main" style={{ maxWidth: 560, marginInline: 'auto' }}>
            <Suspense fallback={<RouteSkeleton />}>
              <Routes>
                <Route path="/" element={<AuthEntryPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/institute-signup" element={<InstituteSignup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </section>
        </main>
      </SignedOut>

      <SignedIn>
        {isPublicAuthPath ? (
          <Navigate to={defaultRoute} replace />
        ) : (
          <>
            <div className={sidebarCollapsed ? 'app-layout app-layout-collapsed' : 'app-layout'}>
              <Sidebar
                items={sidebarItems}
                collapsed={sidebarCollapsed}
                onToggle={handleSidebarToggle}
              />

              <div>
                <Navbar
                  onOpenCommandPalette={() => setPaletteOpen(true)}
                  onOpenShortcuts={() => setShortcutsOpen(true)}
                />

                <main id="app-main" className="page-container">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={location.pathname}
                      initial={reducedMotion ? false : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reducedMotion ? undefined : { opacity: 0, y: -10 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                    >
                      <Suspense fallback={<RouteSkeleton />}>
                        <Routes location={location}>
                          <Route element={<ProtectedRoute />}>
                            <Route path="/" element={<Navigate to={defaultRoute} replace />} />
                            <Route path="/home" element={<HomePage />} />
                            <Route path="/settings" element={<SettingsPage />} />
                            <Route path="/about" element={<About />} />
                            <Route path="/services" element={<Services />} />
                            <Route path="/profile" element={<Profile />} />
                          </Route>

                          <Route element={<ProtectedRoute allowedRoles={['student']} />}>
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/problems" element={<ProblemsPage />} />
                            <Route
                              path="/editor"
                              element={<Navigate to={defaultEditorRoute} replace />}
                            />
                            <Route path="/editor/:problemId" element={<Editor />} />
                            <Route
                              path="/problems/:problemId/workspace"
                              element={<LegacyWorkspaceRedirect />}
                            />
                            <Route path="/analytics" element={<AnalyticsPage />} />
                            <Route path="/progress" element={<ProgressPage />} />
                            <Route path="/contests" element={<Contests />} />
                            <Route path="/student-tests" element={<StudentTestsPage />} />
                            <Route path="/institution/join" element={<InstitutionJoinPage />} />
                            <Route path="/test/:testId" element={<StudentTestAttemptPage />} />
                          </Route>

                          <Route element={<ProtectedRoute allowedRoles={['institute']} />}>
                            <Route path="/institution/dashboard" element={<InstituteDashboard />} />
                            <Route path="/institution/create-test" element={<CreateTestPage />} />
                              <Route path="/institution/members" element={<InstitutionMembersPage />} />
                            <Route
                              path="/institution/analytics"
                              element={<InstituteAnalyticsPage />}
                            />
                            <Route
                              path="/institution/test/:testId/lobby"
                              element={<InstitutionTestLobbyPage />}
                            />
                            <Route
                              path="/institution/test/:testId/results"
                              element={<InstitutionTestResultsPage />}
                            />
                          </Route>

                          <Route
                            element={<ProtectedRoute allowedRoles={['student', 'institute']} />}
                          >
                            <Route
                              path="/institution/test/:testId/attempt/:attemptId"
                              element={<StudentTestAttemptPage />}
                            />
                          </Route>

                          <Route path="*" element={<Navigate to={defaultRoute} replace />} />
                        </Routes>
                      </Suspense>
                    </motion.div>
                  </AnimatePresence>
                </main>
              </div>
            </div>

            <CommandPalette
              isOpen={isPaletteOpen}
              onClose={() => setPaletteOpen(false)}
              commands={paletteCommands}
            />
            <ShortcutOverlay isOpen={isShortcutsOpen} onClose={() => setShortcutsOpen(false)} />
          </>
        )}
      </SignedIn>
    </div>
  );
}

export default App;
