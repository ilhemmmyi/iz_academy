/**
 * IZ COACH API client — calls FastAPI AI backend directly.
 * In production, can be routed through n8n webhook instead.
 */

const COACH_API_URL = import.meta.env.VITE_COACH_API_URL || 'http://localhost:8000';

async function callCoach<T = unknown>(endpoint: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${COACH_API_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Coach unavailable' }));
    throw new Error(err.detail || err.message || `Coach error ${res.status}`);
  }
  return res.json();
}

// ── Typed helpers ───────────────────────────────────────────────────────────

export interface Skill { name: string; level: string }
export interface SkillGap { skill: string; reason: string; priority: string }

export interface WeekPlan { week: number; focus: string; courses: string[]; project: string; hours: number }

export interface RoadmapResult {
  student_id: string;
  roadmap: WeekPlan[];
  portfolio_projects: string[];
  estimated_completion: string;
}

export interface ChatMessage { role: 'user' | 'assistant'; content: string }

export interface ChatResult {
  reply: string;
  suggestions: string[];
}

export const coachApi = {
  generateRoadmap(
    studentId: string,
    skills: Skill[],
    gaps: SkillGap[],
    careerGoals: string[],
    availableCourses: { title: string; level: string }[] = [],
    weeks = 12,
  ) {
    return callCoach<RoadmapResult>('/generate_roadmap', {
      student_id: studentId,
      extracted_skills: skills,
      skill_gaps: gaps,
      career_goals: careerGoals,
      available_courses: availableCourses,
      weeks,
    });
  },

  chat(studentId: string, message: string, history: ChatMessage[] = [], context: Record<string, unknown> = {}) {
    return callCoach<ChatResult>('/chat', {
      student_id: studentId,
      message,
      history,
      context,
    });
  },
};
