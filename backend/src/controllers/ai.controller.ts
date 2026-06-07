import { Response } from 'express';
import axios from 'axios';
import { AuthRequest } from '../middlewares/auth.middleware';
import { prisma } from '../config/prisma';

const HF_BASE_URL = 'https://router.huggingface.co/v1/chat/completions';
const HF_MODEL = process.env.HUGGINGFACE_MODEL || 'microsoft/Phi-3.5-mini-instruct';

// --- Types --------------------------------------------------------------------

export interface Questionnaire {
  goal: string;
  domain: string;
  level: string;
  skills: string[];
  availability: string;
  learningStyle: string;
  shortTermGoal: string;
  customAnswers?: Record<string, string>;
}

interface DbCourse {
  id: string;
  title: string;
  shortDescription: string;
  level: string;
  thumbnailUrl: string | null;
}

interface ScoredCourse extends DbCourse {
  score: number;
}

const QUESTIONNAIRE_KEYS = [
  'goal',
  'domain',
  'level',
  'skills',
  'availability',
  'learningStyle',
  'shortTermGoal',
] as const;

function sanitizeQuestionnaire(input: unknown): Questionnaire {
  const source = input && typeof input === 'object' ? input as Record<string, unknown> : {};
  const customAnswersSource =
    source.customAnswers && typeof source.customAnswers === 'object'
      ? source.customAnswers as Record<string, unknown>
      : {};

  const customAnswers = QUESTIONNAIRE_KEYS.reduce<Record<string, string>>((acc, key) => {
    const value = customAnswersSource[key];
    if (typeof value === 'string' && value.trim()) {
      acc[key] = value.trim();
    }
    return acc;
  }, {});

  const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

  return {
    goal:         str(source.goal),
    // accept both new key (domain) and legacy key (field)
    domain:       str(source.domain) || str(source.field),
    level:        str(source.level),
    skills: Array.isArray(source.skills)
      ? source.skills
          .filter((s): s is string => typeof s === 'string')
          .map((s) => s.trim())
          .filter(Boolean)
      : [],
    // accept both new key (availability) and legacy key (hoursPerWeek)
    availability: str(source.availability) || str(source.hoursPerWeek),
    learningStyle: str(source.learningStyle),
    shortTermGoal: str(source.shortTermGoal),
    customAnswers,
  };
}

// --- Keyword scoring ----------------------------------------------------------

const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'this', 'that', 'are', 'from', 'how', 'what',
  'you', 'your', 'will', 'can', 'get', 'use', 'used', 'using', 'les', 'des',
  'une', 'pour', 'dans', 'avec', 'sur', 'cours', 'course', 'learn', 'learning',
  'introduction', 'complete', 'guide', 'basics',
]);

const domainKeywords: Record<string, string[]> = {
  'Développement Web': [
    'web', 'html', 'css', 'javascript', 'react', 'next', 'node', 'express',
    'typescript', 'frontend', 'backend', 'fullstack', 'api', 'rest', 'prisma',
  ],
  'Science des données & Intelligence artificielle': [
    'python', 'data', 'machine learning', 'ml', 'tensorflow', 'keras',
    'scikit', 'pandas', 'numpy', 'matplotlib', 'deep learning', 'neural',
    'mlflow', 'fastapi', 'airflow', 'feature',
  ],
  'Développement Mobile': [
    'mobile', 'ios', 'swift', 'swiftui', 'flutter', 'dart', 'android',
    'riverpod', 'firebase', 'app store', 'google play',
  ],
  'DevOps & Cloud': [
    'docker', 'kubernetes', 'devops', 'aws', 'cloud', 'ci/cd', 'github actions',
    'helm', 'prometheus', 'grafana', 'terraform', 'lambda', 'ec2', 's3',
  ],
  'Cybersécurité & Hacking Éthique': [
    'cybersécurité', 'hacking', 'sécurité', 'pentest', 'kali', 'metasploit',
    'nmap', 'burp', 'owasp', 'sql injection', 'xss', 'exploitation',
  ],
  'Design': [
    'design', 'ui', 'ux', 'figma', 'illustrator', 'photoshop', 'indesign',
    'wireframe', 'prototype', 'couleur', 'typographie', 'adobe', 'branding',
  ],
  'Bases de données & SQL': [
    'sql', 'postgresql', 'base de données', 'requête', 'jointure', 'index',
    'optimisation', 'nosql', 'mongodb', 'prisma', 'orm',
  ],
  'Blockchain & Web3': [
    'blockchain', 'web3', 'solidity', 'ethereum', 'smart contract', 'nft',
    'hardhat', 'ethers', 'ipfs', 'defi', 'crypto',
  ],
  'Marketing Digital & SEO': [
    'marketing', 'seo', 'google ads', 'meta ads', 'email', 'campagne',
    'analytics', 'conversion', 'social media', 'contenu', 'ahrefs',
  ],
};

const levelKeywords: Record<string, string[]> = {
  'Débutant': ['débutant', 'beginner', 'introduction', 'fondamentaux', 'bases'],
  'Intermédiaire': ['intermédiaire', 'intermediate', 'approfondissement', 'avancé', 'masterclass'],
  'Avancé': ['avancé', 'advanced', 'expert', 'production', 'architecture', 'système'],
};

function normalizeLevelForScoring(level: string): string {
  const l = level.toLowerCase();
  if (l.includes('débutant') || l.includes('beginner')) return 'beginner';
  if (l.includes('intermédiaire') || l.includes('intermediate')) return 'intermediate';
  if (l.includes('avancé') || l.includes('advanced')) return 'advanced';
  if (l.includes('basic') || l.includes('basique')) return 'basic';
  return l;
}

function getDomainKeywords(domain: string): string[] {
  for (const [key, keywords] of Object.entries(domainKeywords)) {
    if (domain.toLowerCase().includes(key.toLowerCase().split(' ')[0].toLowerCase())) {
      return keywords;
    }
  }
  return [];
}

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
    return scored.sort((a, b) => b.score - a.score).slice(0, 3);
  }

  return matched.slice(0, 3);
}

// --- Fallback qualitative analysis from questionnaire (no AI needed) ----------

function buildFallbackAnalysis(q: Questionnaire, topCourses: ScoredCourse[]): {
  strengths: string[];
  weaknesses: string[];
  focusAreas: string[];
  learningPlan: string;
} {
  const levelLabels: Record<string, string> = {
    beginner: 'débutant',
    basic: 'niveau basique',
    intermediate: 'niveau intermédiaire',
    advanced: 'niveau avancé',
  };
  const levelLabel = levelLabels[normalizeLevelForScoring(q.level ?? '')] ?? q.level;

  // Strengths — based on declared skills and learning style
  const strengths: string[] = [];
  if (q.skills.length > 0) {
    strengths.push(`Tu maîtrises déjà : ${q.skills.join(', ')}`);
  }
  if (q.learningStyle) {
    strengths.push(`Ton style d'apprentissage (${q.learningStyle}) te permet d'assimiler efficacement de nouveaux concepts`);
  }
  if (q.availability) {
    strengths.push(`Tu disposes de ${q.availability} par semaine, ce qui est suffisant pour progresser régulièrement`);
  }
  if (strengths.length === 0) strengths.push('Motivation et volonté de progresser dans ' + q.domain);

  // Weaknesses — based on level vs goal
  const weaknesses: string[] = [];
  const normalizedLvl = normalizeLevelForScoring(q.level ?? '');
  const isEarlyLevel = ['beginner', 'basic'].includes(normalizedLvl);
  if (isEarlyLevel) {
    weaknesses.push(`En tant que ${levelLabel} en ${q.domain}, certaines compétences fondamentales restent à consolider`);
  }
  weaknesses.push(`Pour atteindre ton objectif "${q.shortTermGoal}", il te manque encore de l'expérience pratique`);
  if (q.skills.length === 0 || (q.skills.length === 1 && q.skills[0] === 'Aucune de ces technologies')) {
    weaknesses.push(`Aucune compétence technique déclarée — il faudra partir des bases de ${q.domain}`);
  }

  // Focus areas — based on domain and goal
  const focusAreas: string[] = [`Fondamentaux de ${q.domain}`];
  if (q.shortTermGoal) focusAreas.push(q.shortTermGoal);
  if (topCourses.length > 0) focusAreas.push(`Mise en pratique via les cours recommandés`);
  focusAreas.push('Projets concrets pour renforcer ton portfolio');

  // Learning plan — personalized to hours/week and courses
  const courseNames = topCourses.slice(0, 3).map((c) => `"${c.title}"`).join(', ');
  const learningPlan = `En investissant ${q.availability} par semaine, commence par les cours ${courseNames || 'recommandés ci-dessus'} pour construire une base solide en ${q.domain}. Concentre-toi sur la pratique régulière et applique chaque concept appris dans un mini-projet personnel. En quelques semaines tu seras en mesure d'atteindre ton objectif : ${q.shortTermGoal}.`;

  return { strengths, weaknesses, focusAreas: focusAreas.slice(0, 4), learningPlan };
}

// --- AI prompt: qualitative analysis only (courses pre-selected by scoring) ---

function buildAnalysisMessages(
  q: Questionnaire,
  topCourses: ScoredCourse[],
) {
  const courseList =
    topCourses.length > 0
      ? topCourses.map((c, i) => `${i + 1}. "${c.title}" (${c.level})`).join('\n')
      : 'Aucun cours correspondant.';

  const customSection = q.customAnswers && Object.keys(q.customAnswers).length > 0
    ? '\n### Réponses personnalisées de l\'étudiant :\n' +
      Object.entries(q.customAnswers).map(([k, v]) => `- ${k}: ${v}`).join('\n')
    : '';

  const userContent = `TÂCHE DE COACHING : Analyse le profil de cet apprenant et fournis des conseils de coaching personnalisés EN FRANÇAIS.

### Profil de l'apprenant :
- Objectif : ${q.goal} → ${q.shortTermGoal}
- Domaine d'intérêt : ${q.domain}
- Niveau actuel : ${q.level}
- Compétences connues : ${q.skills.length > 0 ? q.skills.join(', ') : 'Aucune listée'}
- Temps disponible/semaine : ${q.availability}
- Style d'apprentissage préféré : ${q.learningStyle}${customSection}

### Cours pré-sélectionnés correspondant à ce profil :
${courseList}

---

Retourne UNIQUEMENT ce JSON exact (pas de balises markdown, pas de texte supplémentaire) :
{
  "strengths": ["point fort concret 1 basé sur les réponses de l'étudiant", "point fort concret 2"],
  "weaknesses": ["lacune spécifique 1 par rapport à l'objectif", "lacune spécifique 2"],
  "focusAreas": ["priorité d'apprentissage 1", "priorité 2", "priorité 3"],
  "learningPlan": "2-3 phrases directes et personnalisées utilisant les cours pré-sélectionnés, en français"
}`;

  return [
    {
      role: 'system',
      content:
        'Tu es un coach carrière expert pour une plateforme e-learning. Réponds UNIQUEMENT en français. Génère UNIQUEMENT du JSON valide strict — sans balises markdown, sans prose en dehors du JSON. Sois spécifique et concret.',
    },
    { role: 'user', content: userContent },
  ];
}

// --- Controller ---------------------------------------------------------------

export const getRecommendation = async (req: AuthRequest, res: Response) => {
  try {
    // -- 1. Parse & validate questionnaire ----------------------------------
    let rawQuestionnaire: unknown;
    try {
      rawQuestionnaire =
        typeof req.body.questionnaire === 'string'
          ? JSON.parse(req.body.questionnaire)
          : req.body.questionnaire ?? req.body;
    } catch {
      return res.status(400).json({ message: 'Invalid questionnaire format (not valid JSON).' });
    }

    const questionnaire = sanitizeQuestionnaire(rawQuestionnaire);

    if (!questionnaire?.goal || !questionnaire?.domain || !questionnaire?.level) {
      return res
        .status(400)
        .json({ message: 'Missing required questionnaire fields: goal, domain, level.' });
    }

    // -- 2. Fetch published courses from DB --------------------------------
    const dbCourses = await prisma.course.findMany({
      where: { isPublished: true },
      select: { id: true, title: true, shortDescription: true, level: true, thumbnailUrl: true },
      orderBy: { createdAt: 'asc' },
    });

    // -- 3. Score & rank courses using keyword matching --------------------
    const profileText = [
      questionnaire.goal,
      questionnaire.domain,
      questionnaire.shortTermGoal,
      questionnaire.skills.join(' '),
      questionnaire.learningStyle,
      ...getDomainKeywords(questionnaire.domain),
      ...Object.values(questionnaire.customAnswers ?? {}),
    ].join(' ');

    const userKeywords = extractKeywords(profileText);
    const normalizedLevel = normalizeLevelForScoring(questionnaire.level);
    const topCourses = scoreCourses(dbCourses, userKeywords, normalizedLevel);

    // -- 4. Call AI for qualitative analysis only --------------------------
    const apiKey = process.env.HUGGINGFACE_API_KEY;

    let strengths: string[] = [];
    let weaknesses: string[] = [];
    let focusAreas: string[] = [];
    let learningPlan = '';

    if (apiKey) {
      try {
        const messages = buildAnalysisMessages(questionnaire, topCourses);

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
      } catch (aiErr: any) {
        const status = (aiErr as any)?.response?.status;
        const detail = (aiErr as any)?.response?.data?.error?.message ?? (aiErr as any)?.response?.data?.error ?? (aiErr as any)?.message;
        console.warn(`[AI] HuggingFace call failed (${status ?? 'unknown'}): ${detail} -- returning scored courses only.`);
      }
    } else {
      console.warn('[AI] No HUGGINGFACE_API_KEY — returning scored courses only.');
    }

    // -- 4b. Fallback: generate qualitative analysis if AI returned nothing --
    if (strengths.length === 0 && weaknesses.length === 0 && focusAreas.length === 0 && !learningPlan) {
      const fallback = buildFallbackAnalysis(questionnaire, topCourses);
      strengths = fallback.strengths;
      weaknesses = fallback.weaknesses;
      focusAreas = fallback.focusAreas;
      learningPlan = fallback.learningPlan;
    }

    // -- 5. Build response object ------------------------------------------
    const result = {
      recommendedCourses: topCourses,
      strengths,
      weaknesses,
      focusAreas,
      learningPlan,
    };

    return res.json(result);
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
          .json({ message: 'AI model is loading, please try again in 20�30 seconds.', loading: true });
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


