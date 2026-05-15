import { apiClient } from './client';

export const paymentsApi = {
  getAll: () => apiClient('/payments'),
  getMine: () => apiClient('/payments/me'),
  create: (courseId: string, amount: number) =>
    apiClient('/payments', { method: 'POST', body: JSON.stringify({ courseId, amount }) }),
};
