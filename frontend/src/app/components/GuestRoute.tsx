import { Navigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';

interface Props {
  children: React.ReactNode;
}

const DASHBOARD_BY_ROLE: Record<string, string> = {
  STUDENT: '/student',
  TEACHER: '/teacher',
  ADMIN: '/admin',
};

/**
 * Redirects already-authenticated users away from guest-only pages
 * (login, register) to their role's dashboard.
 */
export function GuestRoute({ children }: Props) {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );

  if (user) return <Navigate to={DASHBOARD_BY_ROLE[user.role] ?? '/'} replace />;

  return <>{children}</>;
}
