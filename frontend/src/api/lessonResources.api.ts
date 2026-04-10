import { apiClient, getAccessToken } from './client';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface LessonResource {
  id: string;
  title: string;
  type: 'FILE' | 'LINK';
  url: string;
  lessonId: string;
  createdAt: string;
}

export const lessonResourcesApi = {
  getResources: (lessonId: string): Promise<LessonResource[]> =>
    apiClient(`/lessons/${lessonId}/resources`),

  uploadFile: async (lessonId: string, title: string, file: File): Promise<LessonResource> => {
    const form = new FormData();
    form.append('title', title);
    form.append('file', file);
    const res = await fetch(`${BASE_URL}/lessons/${lessonId}/resources/file`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getAccessToken()}` },
      body: form,
      credentials: 'include',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Upload failed');
    }
    return res.json();
  },

  addLink: (lessonId: string, title: string, url: string): Promise<LessonResource> =>
    apiClient(`/lessons/${lessonId}/resources/link`, {
      method: 'POST',
      body: JSON.stringify({ title, url }),
    }),

  deleteResource: (id: string): Promise<void> =>
    apiClient(`/lessons/resources/${id}`, { method: 'DELETE' }),
};
