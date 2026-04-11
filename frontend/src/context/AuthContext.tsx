import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import { authApi } from '../api/auth.api';
import { setAccessToken, apiClient } from '../api/client';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  hasCompletedCoach: boolean;
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
        // Call refresh directly via fetch (not apiClient) to avoid auto-refresh loop
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
    if (res.requires2FA) return res; // caller handles 2FA
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
