import { Navigate } from 'react-router';

export function Register() {
  return <Navigate to="/login" state={{ mode: 'register' }} replace />;
}
