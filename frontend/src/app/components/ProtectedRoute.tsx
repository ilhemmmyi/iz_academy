import { Navigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';

interface Props {
  children: React.ReactNode;
  roles?: string[];
}

export function ProtectedRoute({ children, roles }: Props) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen">Chargement...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}
