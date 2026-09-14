import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

type Role = 'admin' | 'teacher' | 'student' | 'guardian';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: Role;
  /** Optional array — any of these roles is allowed */
  allowedRoles?: Role[];
  /**
   * When true, only the platform admin (founder) may access this route.
   * Non-founders are redirected to /dashboard.
   */
  requiredPlatformAdmin?: boolean;
}

export function ProtectedRoute({
  children,
  requiredRole,
  allowedRoles,
  requiredPlatformAdmin,
}: ProtectedRouteProps) {
  const { user, isLoading, isPlatformAdmin } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-[3px] border-border border-t-primary-500" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Founder-only routes — backend enforces this too, but we gate here
  // so non-founders never even see the shell.
  if (requiredPlatformAdmin && !isPlatformAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user.role)) {
      return <Navigate to="/dashboard" replace />;
    }
    return <>{children}</>;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}