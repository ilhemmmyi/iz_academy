import { apiClient } from './client';

export interface CareerQuestionnaire {
  goal: string;
  domain: string;
  level: string;
  skills: string[];
  availability: string;
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
  ): Promise<RecommendationResult> {
    // Send both new and legacy field names so old and new backend versions both work
    const payload = {
      ...questionnaire,
      field: questionnaire.domain,
      hoursPerWeek: questionnaire.availability,
    };

    return apiClient('/ai/recommendation', {
      method: 'POST',
      body: JSON.stringify({ questionnaire: payload }),
    });
  },
};
