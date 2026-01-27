/**
 * Protected Route Component
 * 
 * Wraps routes that require authentication and specific roles.
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireStudent?: boolean;
}

export function ProtectedRoute({
  children,
  requireAdmin = false,
  requireStudent = false,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, isAdmin, isStudent } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  if (requireStudent && !isStudent) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

