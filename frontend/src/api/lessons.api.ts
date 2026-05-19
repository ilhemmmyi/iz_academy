import { apiClient, getAccessToken } from './client';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const lessonsApi = {
  getProgress: (lessonId: string): Promise<{ completed: boolean; watchedSeconds: number; durationSeconds: number }> =>
    apiClient(`/lessons/${lessonId}/progress`),
  complete: (lessonId: string) => apiClient(`/lessons/${lessonId}/complete`, { method: 'POST' }),
  getVideoUrl: (lessonId: string): Promise<{ url: string }> =>
    apiClient(`/lessons/${lessonId}/video-url`),
  saveVideoProgress: (lessonId: string, watchedSeconds: number, durationSeconds: number) =>
    apiClient(`/lessons/${lessonId}/video-progress`, {
      method: 'POST',
      body: JSON.stringify({ watchedSeconds, durationSeconds }),
    }),
  // keepalive: true guarantees the request completes even when the page is unloading.
  // Must bypass apiClient (which doesn't pass keepalive) and build the fetch directly.
  saveVideoProgressBeacon(lessonId: string, watchedSeconds: number, durationSeconds: number) {
    const token = getAccessToken();
    fetch(`${BASE_URL}/lessons/${lessonId}/video-progress`, {
      method: 'POST',
      keepalive: true,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
      body: JSON.stringify({ watchedSeconds, durationSeconds }),
    }).catch(() => {});
  },
};
