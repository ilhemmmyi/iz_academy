import { apiClient } from './client';

export const quizApi = {
  getByCourse: (courseId: string) => apiClient(`/quizzes/${courseId}`),
  getByLesson: (lessonId: string) => apiClient(`/quizzes/lesson/${lessonId}`),
  submit: (quizId: string, answers: Record<string, number>) =>
    apiClient(`/quizzes/${quizId}/attempt`, { method: 'POST', body: JSON.stringify({ answers }) }),
};
