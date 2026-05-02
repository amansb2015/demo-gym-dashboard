import type { ReactNode } from 'react';
import { useAuth } from '../providers/AuthProvider';
import type { UserRole } from '../types/database';

export function RoleGate({ allow, children }: { allow: UserRole[]; children: ReactNode }) {
  const { role } = useAuth();
  if (!role || !allow.includes(role)) return null;
  return <>{children}</>;
}
