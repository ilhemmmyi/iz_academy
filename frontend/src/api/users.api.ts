import { apiClient } from './client';

export const usersApi = {
  getMe: () => apiClient('/users/me'),
  updateMe: (data: { name?: string; avatarUrl?: string }) =>
    apiClient('/users/me', { method: 'PUT', body: JSON.stringify(data) }),
  getAll: () => apiClient('/users'),
  getStudentOverview: (userId: string) => apiClient(`/users/${userId}/overview`),
  createUser: (data: { name: string; email: string; role: string; formation?: string; duree?: string; dateDebut?: string }) =>
    apiClient('/users', { method: 'POST', body: JSON.stringify(data) }),
  assignCourses: (userId: string, courseIds: string[]) =>
    apiClient(`/users/${userId}/courses`, { method: 'PUT', body: JSON.stringify({ courseIds }) }),
  updateUser: (id: string, data: { role?: string; isActive?: boolean; formation?: string; duree?: string; dateDebut?: string; name?: string; email?: string }) =>
    apiClient(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteUser: (id: string) => apiClient(`/users/${id}`, { method: 'DELETE' }),
  resetPassword: (id: string) => apiClient(`/users/${id}/reset-password`, { method: 'POST' }),
  revokeCertificate: (userId: string, courseId: string) =>
    apiClient(`/users/${userId}/certificates/${courseId}`, { method: 'DELETE' }),
  removeStudentCourseAccess: (userId: string, courseId: string) =>
    apiClient(`/users/${userId}/enrollments/${courseId}`, { method: 'DELETE' }),
};
