import { apiClient } from './client';

export type Activity = {
  id: string;
  type: 'COMMENT_REPLY' | 'MESSAGE' | 'PROJECT_UPDATE';
  message: string;
  link: string | null;
  createdAt: string;
};

export const activitiesApi = {
  getMyActivities: (): Promise<Activity[]> => apiClient('/activities/me'),
};
