import { apiClient } from './client';

export const reportsApi = {
  create: (data: { reason: string; messageId?: string; commentId?: string }) =>
    apiClient('/reports', { method: 'POST', body: JSON.stringify(data) }),

  getAll: () => apiClient('/reports'),

  markReviewed: (id: string) =>
    apiClient(`/reports/${id}/review`, { method: 'PUT' }),
};
