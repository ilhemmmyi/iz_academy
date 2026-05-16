import { apiClient } from './client';

export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    apiClient('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  login: (data: { email: string; password: string }) =>
    apiClient('/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  loginWithGoogle: (data: { uid: string; email: string; displayName: string; firebaseToken: string }) =>
    apiClient('/auth/google', { method: 'POST', body: JSON.stringify(data) }),

  logout: () => apiClient('/auth/logout', { method: 'POST' }),

  verifyEmail: (token: string) =>
    apiClient(`/auth/verify-email?token=${encodeURIComponent(token)}`),

  forgotPassword: (email: string) =>
    apiClient('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),

  resetPassword: (token: string, password: string) =>
    apiClient('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) }),
};
