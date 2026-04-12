import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getInstitutionSessionToken } from '../utils/institutionSession';

function InstitutionProtectedRoute() {
  const location = useLocation();
  const token = getInstitutionSessionToken();

  if (!token) {
    return <Navigate to="/institution/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

export default InstitutionProtectedRoute;