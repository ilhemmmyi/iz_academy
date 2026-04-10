import { Response } from 'express';
import axios from 'axios';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse') as (buffer: Buffer) => Promise<{ text: string }>;
import { AuthRequest } from '../middlewares/auth.middleware';
import { prisma } from '../config/prisma';

const HF_BASE_URL = 'https://router.huggingface.co/v1/chat/completions';
const HF_MODEL = process.env.HUGGINGFACE_MODEL || 'Qwen/Qwen2.5-72B-Instruct';

// --- Types --------------------------------------------------------------------

export interface Questionnaire {
  goal: string;
  field: string;
  level: string;
  skills: string[];
  hoursPerWeek: string;
  learningStyle: string;
  shortTermGoal: string;
}

interface DbCourse {
  id: string;
  title: string;
  shortDescription: string;
  level: string;
}

interface ScoredCourse extends DbCourse {
  score: number;
}

// --- Keyword scoring ----------------------------------------------------------

const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'this', 'that', 'are', 'from', 'how', 'what',
  'you', 'your', 'will', 'can', 'get', 'use', 'used', 'using', 'les', 'des',
  'une', 'pour', 'dans', 'avec', 'sur', 'cours', 'course', 'learn', 'learning',
  'introduction', 'complete', 'guide', 'basics',
]);

function extractKeywords(text: string): string[] {
  return [
    ...new Set(
      text
        .toLowerCase()
        .split(/[\s,./\-_|()+:;'"!?\n\r]+/)
        .filter((w) => w.length > 2 && !STOPWORDS.has(w)),
    ),
  ];
}

function scoreCourses(
  courses: DbCourse[],
  userKeywords: string[],
  userLevel: string,
): ScoredCourse[] {
  const levels = ['beginner', 'basic', 'intermediate', 'advanced'];
  const userIdx = levels.indexOf(userLevel.toLowerCase());

  const scored = courses.map((c) => {
    const titleLower = c.title.toLowerCase();
    const descLower = c.shortDescription.toLowerCase();
    let score = 0;

    for (const kw of userKeywords) {
      if (titleLower.includes(kw)) score += 3;
      else if (descLower.includes(kw)) score += 1;
    }

    const courseIdx = levels.indexOf(c.level.toLowerCase());
    if (userIdx !== -1 && courseIdx !== -1) {
      const diff = Math.abs(courseIdx - userIdx);
      if (diff === 0) score += 3;
      else if (diff === 1) score += 1;
    }

    return { ...c, score };
  });

  const matched = scored.filter((c) => c.score > 0).sort((a, b) => b.score - a.score);

  if (matched.length === 0) {
    return scored.sort((a, b) => b.score - a.score).slice(0, 5);
  }

  return matched.slice(0, 6);
}

// --- AI prompt: qualitative analysis only (courses pre-selected by scoring) ---

function buildAnalysisMessages(
  q: Questionnaire,
  cvText: string | undefined,
  topCourses: ScoredCourse[],
) {
  const cvSection = cvText ? cvText.substring(0, 1500) : 'No CV provided.';
  const courseList =
    topCourses.length > 0
      ? topCourses.map((c, i) => `${i + 1}. "${c.title}" (${c.level})`).join('\n')
      : 'No courses matched.';

  const userContent = `COACHING TASK: Analyze this learner's profile and provide personalized coaching insights.

### Learner Profile:
- Objective: ${q.goal} — ${q.shortTermGoal}
- Field: ${q.field}
- Level: ${q.level}
- Known skills: ${q.skills.length > 0 ? q.skills.join(', ') : 'None listed'}
- Available time/week: ${q.hoursPerWeek}
- Learning style: ${q.learningStyle}

### CV Extract:
${cvSection}

### Pre-selected courses that match this profile:
${courseList}

---

Return ONLY this exact JSON (no markdown fences, no extra text, no comments):
{
  "strengths": ["concrete strength 1 based on skills/CV", "concrete strength 2"],
  "weaknesses": ["specific skill gap 1 vs the objective", "specific skill gap 2"],
  "focusAreas": ["priority area 1", "priority area 2", "priority area 3"],
  "learningPlan": "2-3 direct personalized sentences using the pre-selected courses"
}`;

  return [
    {
      role: 'system',
      content:
        'You are a career coach for an e-learning platform. Output ONLY strict valid JSON — no markdown fences, no prose outside the JSON. Be specific and concrete.',
    },
    { role: 'user', content: userContent },
  ];
}

// --- Controller ---------------------------------------------------------------

export const getRecommendation = async (req: AuthRequest, res: Response) => {
  try {
    // -- 1. Parse & validate questionnaire ----------------------------------
    let questionnaire: Questionnaire;
    try {
      questionnaire =
        typeof req.body.questionnaire === 'string'
          ? JSON.parse(req.body.questionnaire)
          : req.body.questionnaire;
    } catch {
      return res.status(400).json({ message: 'Invalid questionnaire format (not valid JSON).' });
    }

    if (!questionnaire?.goal || !questionnaire?.field || !questionnaire?.level) {
      return res
        .status(400)
        .json({ message: 'Missing required questionnaire fields: goal, field, level.' });
    }

    // -- 2. Extract CV text from uploaded PDF (optional) --------------------
    let cvText: string | undefined;
    if (req.file?.buffer) {
      try {
        const parsed = await pdfParse(req.file.buffer);
        cvText = parsed.text?.trim() || undefined;
      } catch {
        console.warn('[AI] CV PDF parse failed, continuing without CV.');
      }
    }

    // -- 3. Fetch published courses from DB --------------------------------
    const dbCourses = await prisma.course.findMany({
      where: { isPublished: true },
      select: { id: true, title: true, shortDescription: true, level: true },
      orderBy: { createdAt: 'asc' },
    });

    // -- 4. Score & rank courses using keyword matching --------------------
    const profileText = [
      questionnaire.goal,
      questionnaire.field,
      questionnaire.shortTermGoal,
      questionnaire.skills.join(' '),
      questionnaire.learningStyle,
      cvText ?? '',
    ].join(' ');

    const userKeywords = extractKeywords(profileText);
    const topCourses = scoreCourses(dbCourses, userKeywords, questionnaire.level);

    // -- 5. Call AI for qualitative analysis only --------------------------
    const apiKey = process.env.HUGGINGFACE_API_KEY;

    let strengths: string[] = [];
    let weaknesses: string[] = [];
    let focusAreas: string[] = [];
    let learningPlan = '';

    if (apiKey) {
      const messages = buildAnalysisMessages(questionnaire, cvText, topCourses);

      const { data } = await axios.post(
        HF_BASE_URL,
        { model: HF_MODEL, messages, max_tokens: 600, temperature: 0.3, top_p: 0.9 },
        {
          headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          timeout: 60000,
        },
      );

      const rawText: string = data?.choices?.[0]?.message?.content ?? '';

      if (rawText.trim()) {
        try {
          const cleaned = rawText
            .replace(/^```(?:json)?\s*/i, '')
            .replace(/\s*```$/i, '')
            .trim();
          const parsed = JSON.parse(cleaned);
          strengths = Array.isArray(parsed.strengths) ? parsed.strengths : [];
          weaknesses = Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [];
          focusAreas = Array.isArray(parsed.focusAreas) ? parsed.focusAreas : [];
          learningPlan = typeof parsed.learningPlan === 'string' ? parsed.learningPlan : '';
        } catch {
          console.warn('[AI] Could not parse AI JSON response.');
        }
      }
    } else {
      console.warn('[AI] No HUGGINGFACE_API_KEY — returning scored courses only.');
    }

    // -- 6. Return structured response -------------------------------------
    return res.json({
      recommendedCourses: topCourses,
      strengths,
      weaknesses,
      focusAreas,
      learningPlan,
      cvParsed: !!cvText,
    });
  } catch (err: any) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      const detail =
        err.response?.data?.error?.message ??
        err.response?.data?.error ??
        err.response?.data?.message ??
        err.message;

      console.error(`[AI] HuggingFace ${status}: ${detail}`);

      if (status === 401 || status === 403) {
        return res
          .status(500)
          .json({ message: 'Invalid HuggingFace API key. Check HUGGINGFACE_API_KEY in .env.' });
      }
      if (status === 429) {
        return res.status(429).json({ message: 'AI rate limit reached. Please wait and retry.' });
      }
      if (status === 503) {
        return res
          .status(503)
          .json({ message: 'AI model is loading, please try again in 20–30 seconds.', loading: true });
      }
      if (err.code === 'ECONNABORTED' || status === 504) {
        return res.status(504).json({ message: 'AI request timed out. Please try again.' });
      }
      return res
        .status(502)
        .json({ message: `AI service error (${status ?? 'unknown'}): ${detail}` });
    }

    console.error('[AI] Unexpected error:', err?.message);
    return res.status(500).json({ message: 'Failed to get AI recommendation.' });
  }
};
