import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getAdminSessionToken } from '../utils/adminSession';

function AdminProtectedRoute() {
  const location = useLocation();
  const token = getAdminSessionToken();

  if (!token) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

export default AdminProtectedRoute;
