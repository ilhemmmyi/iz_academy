import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import { authApi } from '../api/auth.api';
import { setAccessToken, apiClient, initCsrf } from '../api/client';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  hasCompletedCoach: boolean;
  mustChangePassword: boolean;
  hasPassword: boolean;
  phone?: string;
  address?: string;
  educationLevel?: string;
  studentStatus?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  loginWithGoogle: () => Promise<any>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  markCoachCompleted: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount, try to refresh token silently
  useEffect(() => {
    const init = async () => {
      try {
        // 1. Fetch CSRF token first — required before any state-changing request.
        //    /auth/csrf-token is a GET, exempt from CSRF validation.
        await initCsrf();

        // 2. Call refresh directly via fetch (not apiClient) to avoid auto-refresh loop.
        //    /auth/refresh is exempt from CSRF (sameSite=strict on the cookie handles it).
        const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });
        if (!refreshRes.ok) throw new Error('Not authenticated');
        const data = await refreshRes.json();
        setAccessToken(data.accessToken);
        const me = await apiClient('/users/me');
        setUser(me);
      } catch {
        // not logged in
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    setAccessToken(res.accessToken);
    setUser(res.user);
    return res;                            
  };

  const loginWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    const firebaseToken = await result.user.getIdToken();
    const res = await authApi.loginWithGoogle({
      uid: result.user.uid,
      email: result.user.email!,
      displayName: result.user.displayName || result.user.email!,
      firebaseToken,
    });
    setAccessToken(res.accessToken);
    setUser(res.user);
    return res;
  };

  const logout = async () => {
    await authApi.logout();
    setAccessToken(null);
    setUser(null);
  };

  const markCoachCompleted = async () => {
    await apiClient('/users/me/complete-coach', { method: 'PATCH' });
    setUser((prev) => prev ? { ...prev, hasCompletedCoach: true } : prev);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, logout, setUser, markCoachCompleted }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
