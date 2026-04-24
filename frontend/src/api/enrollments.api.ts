import { apiClient } from './client';

export interface EnrollmentExtraInfo {
  phone: string;
  address: string;
  educationLevel: string;
  studentStatus: string;
}

export const enrollmentsApi = {
  request: (courseId: string, message?: string, extraInfo?: EnrollmentExtraInfo) =>
    apiClient('/enrollments', { method: 'POST', body: JSON.stringify({ courseId, message, ...extraInfo }) }),

  getAll: () => apiClient('/enrollments'),

  getMine: () => apiClient('/enrollments/me'),

  updateStatus: (id: string, status: 'APPROVED' | 'REJECTED') =>
    apiClient(`/enrollments/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }),

  delete: (id: string) =>
    apiClient(`/enrollments/${id}`, { method: 'DELETE' }),

  getTeacherStudents: () => apiClient('/enrollments/teacher/students'),

  getWatchStats: () =>
    apiClient('/enrollments/watch-stats') as Promise<{ day: string; seconds: number }[]>,
};
