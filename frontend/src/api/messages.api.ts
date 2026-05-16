import { apiClient } from './client';

export const messagesApi = {
  getContacts: () => apiClient('/messages/contacts'),
  getAll: (cursor?: string, limit = 50) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (cursor) params.set('cursor', cursor);
    return apiClient(`/messages?${params}`);
  },
  send: (receiverId: string, content: string) =>
    apiClient('/messages', { method: 'POST', body: JSON.stringify({ receiverId, content }) }),
  markRead: (id: string) =>
    apiClient(`/messages/${id}/read`, { method: 'PUT' }),
  markAllRead: (senderId: string) =>
    apiClient('/messages/mark-all-read', { method: 'PUT', body: JSON.stringify({ senderId }) }),
};

