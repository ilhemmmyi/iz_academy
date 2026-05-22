import { apiClient } from './client';

export const settingsApi = {
  getAll: (): Promise<Record<string, string>> =>
    apiClient('/settings'),

  update: (key: string, value: string): Promise<{ key: string; value: string }> =>
    apiClient('/settings', {
      method: 'PATCH',
      body: JSON.stringify({ key, value }),
    }),
};
