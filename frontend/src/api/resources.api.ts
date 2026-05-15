import { apiClient, getAccessToken } from './client';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface CourseResource {
  id: string;
  title: string;
  fileUrl: string;
  fileType: string;
  courseId: string;
  createdAt: string;
}

export const resourcesApi = {
  getResources: (courseId: string): Promise<CourseResource[]> =>
    apiClient(`/courses/${courseId}/resources`),

  uploadResource: async (courseId: string, title: string, file: File): Promise<CourseResource> => {
    const form = new FormData();
    form.append('title', title);
    form.append('file', file);
    const res = await fetch(`${BASE_URL}/courses/${courseId}/resources`, {
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

  deleteResource: (id: string): Promise<void> =>
    apiClient(`/courses/resources/${id}`, { method: 'DELETE' }),
};
