import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center text-sm font-semibold text-slate-500">Checking your session...</div>;
  }

  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  if (!user.isEmailVerified) return <Navigate to="/login?verify=1" replace />;

  return <Outlet />;
}

export default ProtectedRoute;

