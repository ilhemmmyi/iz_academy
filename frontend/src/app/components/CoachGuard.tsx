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

  if (loading) return null;

  if (user?.role === 'STUDENT' && !user.hasCompletedCoach) {
    return <Navigate to="/student/career" replace />;
  }

  return <>{children}</>;
}
