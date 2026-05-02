import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { PageLoader } from '../ui/PageLoader';
import { useAuth } from '../../providers/AuthProvider';
import type { UserRole } from '../../types/database';

export function ProtectedRoute({ children, roles }: { children: ReactNode; roles?: UserRole[] }) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (roles?.length && (!role || !roles.includes(role))) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}
