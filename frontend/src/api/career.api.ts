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
  thumbnailUrl?: string | null;
}

export interface RecommendationResult {
  recommendedCourses: RecommendedCourse[];
  strengths: string[];
  weaknesses: string[];
  focusAreas: string[];
  learningPlan: string;
}

export const careerApi = {
  async getRecommendation(
    questionnaire: CareerQuestionnaire,
    accessToken?: string | null,
  ): Promise<RecommendationResult> {
    const headers: Record<string, string> = {};
    headers['Content-Type'] = 'application/json';
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

    const res = await fetch(`${BASE_URL}/ai/recommendation`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ questionnaire }),
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
};
