import { apiClient } from './client';

export const coursesApi = {
  getAll: (params?: { category?: string; level?: string; search?: string }) => {
    const qs = params ? new URLSearchParams(params as Record<string, string>).toString() : '';
    return apiClient(`/courses${qs ? '?' + qs : ''}`);
  },

  getAdmin: () => apiClient('/courses/admin'),

  getMine: () => apiClient('/courses/mine'),

  getCategories: () => apiClient('/courses/categories'),

  createCategory: (name: string) =>
    apiClient('/courses/categories', { method: 'POST', body: JSON.stringify({ name }) }),

  updateCategory: (id: string, name: string) =>
    apiClient(`/courses/categories/${id}`, { method: 'PUT', body: JSON.stringify({ name }) }),

  deleteCategory: (id: string) =>
    apiClient(`/courses/categories/${id}`, { method: 'DELETE' }),

  getById: (id: string) => apiClient(`/courses/${id}`),

  getProjects: (id: string) => apiClient(`/courses/${id}/projects`),

  create: (data: any) => apiClient('/courses', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: any) => apiClient(`/courses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: string) => apiClient(`/courses/${id}`, { method: 'DELETE' }),

  togglePublish: (id: string) => apiClient(`/courses/${id}/publish`, { method: 'PATCH' }),

  getProgress: (id: string) => apiClient(`/courses/${id}/progress`),

  getReviews: (id: string) => apiClient(`/courses/${id}/reviews`),

  submitReview: (id: string, rating: number, comment?: string) =>
    apiClient(`/courses/${id}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ rating, comment }),
    }),
};
