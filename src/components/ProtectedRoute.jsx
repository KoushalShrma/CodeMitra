import { RedirectToSignIn, SignedIn, SignedOut } from '@clerk/clerk-react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDefaultRouteForUser } from '../utils/authStorage';

function ProtectedRoute({ allowedRoles }) {
  const { user, isAuthLoading } = useAuth();

  return (
    <>
      {/* SignedIn/SignedOut provide a hard auth boundary so unauthenticated access has zero bypass. */}
      <SignedIn>
        {isAuthLoading ? (
          <section className="card-surface p-6 text-sm text-brand-muted">
            Loading secure session...
          </section>
        ) : allowedRoles?.length && !allowedRoles.includes(user?.role) ? (
          <Navigate to={getDefaultRouteForUser(user)} replace />
        ) : (
          <Outlet />
        )}
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}

export default ProtectedRoute;
