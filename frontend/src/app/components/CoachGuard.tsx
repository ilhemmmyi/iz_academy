import { Navigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';

interface Props {
  children: React.ReactNode;
}

/**
 * Redirects STUDENT users who haven't completed the Coach IA
 * to /student/career. All other roles pass through unchanged.
 */
export function CoachGuard({ children }: Props) {
  const { user, loading } = useAuth();

  // M-7 — Afficher un spinner au lieu de null pour éviter le flash
  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );

  if (user?.role === 'STUDENT' && !user.hasCompletedCoach) {
    return <Navigate to="/student/career" replace />;
  }

  return <>{children}</>;
}
