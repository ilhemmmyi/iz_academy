import { apiClient } from './client';

export const usersApi = {
  getMe: () => apiClient('/users/me'),

  updateMe: (data: { name?: string; avatarUrl?: string }) =>
    apiClient('/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getAll: (params: { search?: string; role?: string; page?: number; limit?: number } = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.role && params.role !== 'all') query.set('role', params.role);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return apiClient(`/users${qs ? `?${qs}` : ''}`);
  },

  getStudentOverview: (userId: string) =>
    apiClient(`/users/${userId}/overview`),

  createUser: (data: {
    name: string;
    email: string;
    role: string;
    password: string;
    formation?: string;
    duree?: string;
    dateDebut?: string;
  }) =>
    apiClient('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  changePassword: (data: { currentPassword?: string; newPassword: string }) =>
    apiClient('/users/me/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getEligibleCourses: (teacherId: string) =>
    apiClient(`/users/${teacherId}/eligible-courses`),

  assignCourses: (userId: string, courseIds: string[]) =>
    apiClient(`/users/${userId}/courses`, {
      method: 'PUT',
      body: JSON.stringify({ courseIds }),
    }),

  updateUser: (
    id: string,
    data: {
      role?: string;
      formation?: string;
      duree?: string;
      dateDebut?: string;
      name?: string;
      email?: string;
    }
  ) =>
    apiClient(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteUser: (id: string) =>
    apiClient(`/users/${id}`, { method: 'DELETE' }),

  resetPassword: (id: string) =>
    apiClient(`/users/${id}/reset-password`, { method: 'POST' }),

  revokeCertificate: (userId: string, courseId: string) =>
    apiClient(`/users/${userId}/certificates/${courseId}`, {
      method: 'DELETE',
    }),

  removeStudentCourseAccess: (userId: string, courseId: string) =>
    apiClient(`/users/${userId}/enrollments/${courseId}`, {
      method: 'DELETE',
    }),

  updateAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);

    return apiClient('/users/me/avatar', {
      method: 'PUT',
      body: formData,
    });
  },

  deleteAvatar: () => apiClient('/users/me/avatar', { method: 'DELETE' }),
};
