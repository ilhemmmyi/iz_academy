const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface CareerQuestionnaire {
  goal: string;
  field: string;
  level: string;
  skills: string[];
  hoursPerWeek: string;
  learningStyle: string;
  shortTermGoal: string;
  customAnswers?: Record<string, string>;
}

export interface RecommendedCourse {
  id: string;
  title: string;
  shortDescription: string;
  level: string;
  score: number;
}

export interface RecommendationResult {
  recommendedCourses: RecommendedCourse[];
  strengths: string[];
  weaknesses: string[];
  focusAreas: string[];
  learningPlan: string;
  cvParsed: boolean;
}

export interface SavedCoachData {
  answers: CareerQuestionnaire;
  recommendations: RecommendationResult;
  updatedAt: string;
}

export const careerApi = {
  async getRecommendation(
    questionnaire: CareerQuestionnaire,
    cvFile?: File | null,
    accessToken?: string | null,
  ): Promise<RecommendationResult> {
    const formData = new FormData();
    formData.append('questionnaire', JSON.stringify(questionnaire));
    if (cvFile) formData.append('cv', cvFile);

    const headers: Record<string, string> = {};
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

    const res = await fetch(`${BASE_URL}/ai/recommendation`, {
      method: 'POST',
      headers,
      body: formData,
      credentials: 'include',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw Object.assign(new Error(err.message || 'AI request failed'), {
        loading: err.loading ?? false,
        status: res.status,
      });
    }
    return res.json();
  },

  async getMyCoachData(accessToken?: string | null): Promise<SavedCoachData | null> {
    const headers: Record<string, string> = {};
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
    const res = await fetch(`${BASE_URL}/ai/my-coach`, { headers, credentials: 'include' });
    if (!res.ok) return null;
    return res.json();
  },

  async deleteMyCoachData(accessToken?: string | null): Promise<void> {
    const headers: Record<string, string> = {};
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
    await fetch(`${BASE_URL}/ai/my-coach`, { method: 'DELETE', headers, credentials: 'include' });
  },
};
