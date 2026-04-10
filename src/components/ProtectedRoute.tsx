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
  requireManager?: boolean;
  requireStudent?: boolean;
}

export function ProtectedRoute({
  children,
  requireAdmin = false,
  requireManager = false,
  requireStudent = false,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, isAdmin, isManager, isStudent } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // [OK] Allow public access to evaluation reports (LMS-integrated)
    const isEvaluationPage = window.location.pathname.startsWith('/evaluation/');
    if (isEvaluationPage) {
      return <>{children}</>;
    }
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (requireManager && !isManager) {
    return <Navigate to="/" replace />;
  }

  if (requireStudent && !isStudent) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

