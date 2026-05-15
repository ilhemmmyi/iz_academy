import { apiClient } from './client';

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  isRead: boolean;
  replyMessage?: string | null;
  repliedAt?: string | null;
  createdAt: string;
  repliedBy?: { id: string; name: string; email: string } | null;
}

export const contactApi = {
  submit: (data: { name: string; email: string; subject: string; message: string }) =>
    apiClient('/contact-messages', { method: 'POST', body: JSON.stringify(data) }),
  getAll: (): Promise<ContactMessage[]> => apiClient('/contact-messages'),
  markRead: (id: string) => apiClient(`/contact-messages/${id}/read`, { method: 'PATCH' }),
  reply: (id: string, replyMessage: string): Promise<ContactMessage> =>
    apiClient(`/contact-messages/${id}/reply`, { method: 'POST', body: JSON.stringify({ replyMessage }) }),
};