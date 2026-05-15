const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
import { getAccessToken } from './client';

export const uploadApi = {
  uploadVideo: async (file: File): Promise<{ url: string }> => {
    const form = new FormData();
    form.append('video', file);
    const res = await fetch(`${BASE_URL}/uploads/video`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${getAccessToken()}` },
      body: form,
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  },

  uploadThumbnail: async (file: File): Promise<{ url: string }> => {
    const form = new FormData();
    form.append('image', file);
    const res = await fetch(`${BASE_URL}/uploads/thumbnail`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${getAccessToken()}` },
      body: form,
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  },
};
