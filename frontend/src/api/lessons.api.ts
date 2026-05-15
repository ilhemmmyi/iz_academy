import { apiClient } from './client';

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
};
