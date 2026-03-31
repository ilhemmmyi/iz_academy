import { apiClient } from './client';

export const enrollmentsApi = {
  request: (courseId: string, message?: string) =>
    apiClient('/enrollments', { method: 'POST', body: JSON.stringify({ courseId, message }) }),

  getAll: () => apiClient('/enrollments'),

  getMine: () => apiClient('/enrollments/me'),

  updateStatus: (id: string, status: 'APPROVED' | 'REJECTED') =>
    apiClient(`/enrollments/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }),

  getTeacherStudents: () => apiClient('/enrollments/teacher/students'),
};
