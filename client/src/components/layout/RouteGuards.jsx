import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth, ROLE_HOME } from '@/hooks/useAuth';
import { PageLoader } from '@/components/ui/spinner';

// Frontend guard for UX only — the API enforces the same rules on every request.
export function RequireAuth({ roles }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to={ROLE_HOME[user.role]} replace />;
  return <Outlet />;
}

export function GuestOnly() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <PageLoader />;
  if (user) return <Navigate to={ROLE_HOME[user.role]} replace />;
  return <Outlet />;
}
