import { apiClient, getAccessToken } from './client';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface Certificate {
  id: string;
  courseId: string;
  fileUrl: string | null;
  issuedAt: string;
  course: {
    id: string;
    title: string;
    thumbnailUrl: string | null;
    teacher: { name: string };
  };
}

export interface CertificateDetail extends Certificate {
  user: { name: string };
}

export const certificatesApi = {
  getMine: (): Promise<Certificate[]> => apiClient('/users/me/certificates'),
  getById: (id: string): Promise<CertificateDetail> => apiClient(`/users/me/certificates/${id}`),
  retry: (courseId: string): Promise<{ message: string }> =>
    apiClient(`/users/me/certificates/${courseId}/retry`, { method: 'POST' }),

  /**
   * Fetch the certificate PDF via the backend proxy (avoids CORS/cross-origin issues).
   * Returns a Blob – the caller creates an object URL for download or viewing.
   */
  downloadPdf: async (id: string): Promise<Blob> => {
    const token = getAccessToken();
    const res = await fetch(`${BASE_URL}/users/me/certificates/${id}/pdf`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: 'no-store',
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch PDF');
    return res.blob();
  },
};
