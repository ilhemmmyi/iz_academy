import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { StudentLayout } from '../../components/StudentLayout';
import { CoachOnboardingLayout } from '../../components/CoachOnboardingLayout';
import {
  Bot,
  ChevronRight,
  ChevronLeft,
  X,
  Loader2,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  PenLine,
  TrendingUp,
  AlertTriangle,
  Target,
  BookOpen,
  Trophy,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { careerApi, CareerQuestionnaire, RecommendationResult } from '../../../api/career.api';
import { useAuth } from '../../../context/AuthContext';

// ─── Questionnaire definition ────────────────────────────────────────────────

const STEPS: {
  key: keyof CareerQuestionnaire;
  question: string;
  options: string[];
  multi?: boolean;
}[] = [
  {
    key: 'goal',
    question: 'Quel est votre objectif principal ?',
    options: [
      'Trouver un emploi de développeur web ou mobile',
      'Devenir data scientist ou ingénieur ML',
      'Maîtriser la cybersécurité et le hacking éthique',
      'Me lancer dans le design UI/UX ou graphique',
      'Évoluer vers le DevOps, le cloud ou l\'infrastructure',
      'Comprendre la blockchain et le Web3',
      'Améliorer mes compétences en marketing digital',
    ],
  },
  {
    key: 'domain',
    question: 'Quel domaine vous intéresse le plus ?',
    options: [
      'Développement Web (HTML, CSS, JavaScript, React, Node.js)',
      'Science des données & Intelligence artificielle (Python, ML, TensorFlow)',
      'Développement Mobile (iOS Swift, Flutter, Dart)',
      'DevOps & Cloud (Docker, Kubernetes, AWS)',
      'Cybersécurité & Hacking Éthique (Kali Linux, Metasploit, Burp Suite)',
      'Design (UI/UX Figma, Adobe Illustrator, Photoshop)',
      'Bases de données & SQL (PostgreSQL, requêtes avancées)',
      'Blockchain & Web3 (Solidity, Hardhat, Ethers.js)',
      'Marketing Digital & SEO',
    ],
  },
  {
    key: 'level',
    question: 'Comment évaluez-vous votre niveau actuel ?',
    options: [
      'Débutant — je n\'ai aucune expérience dans ce domaine',
      'Intermédiaire — je connais les bases mais je veux approfondir',
      'Avancé — je maîtrise les fondamentaux et je cherche à me spécialiser',
    ],
  },
  {
    key: 'skills',
    question: 'Quelles technologies ou outils maîtrisez-vous déjà ?',
    options: [
      'HTML / CSS / JavaScript',
      'React / Next.js',
      'Node.js / Express',
      'Python / Pandas / NumPy',
      'SQL / PostgreSQL',
      'Docker / Kubernetes',
      'AWS / Cloud',
      'Figma / Adobe Suite',
      'Swift / Flutter / Dart',
      'Solidity / Web3',
      'Aucune de ces technologies',
    ],
    multi: true,
  },
  {
    key: 'availability',
    question: 'Combien d\'heures par semaine pouvez-vous consacrer à la formation ?',
    options: [
      'Moins de 5 heures',
      'Entre 5 et 10 heures',
      'Entre 10 et 20 heures',
      'Plus de 20 heures',
    ],
  },
  {
    key: 'learningStyle',
    question: 'Quel est votre style d\'apprentissage préféré ?',
    options: [
      'Je préfère apprendre par la pratique avec des projets concrets',
      'Je préfère comprendre la théorie avant de pratiquer',
      'J\'apprends mieux en suivant des tutoriels vidéo pas à pas',
      'Je préfère les défis et les exercices pour tester mes connaissances',
    ],
  },
  {
    key: 'shortTermGoal',
    question: 'Quel est votre objectif dans les 3 à 6 prochains mois ?',
    options: [
      'Décrocher mon premier emploi ou stage en tech',
      'Lancer mon propre projet ou startup',
      'Obtenir une certification reconnue (AWS, etc.)',
      'Changer de carrière vers un domaine tech',
      'Monter en compétences dans mon poste actuel',
      'Construire un portfolio solide de projets',
    ],
  },
];

const EMPTY: CareerQuestionnaire = {
  goal: '',
  domain: '',
  level: '',
  skills: [],
  availability: '',
  learningStyle: '',
  shortTermGoal: '',
  customAnswers: {},
};

function getCourseThumbnailUrl(course: unknown): string | null {
  const courseRecord = course && typeof course === 'object' ? course as Record<string, unknown> : {};
  const thumbnailCandidates = [
    courseRecord.thumbnailUrl,
    courseRecord.thumbnail,
    courseRecord.imageUrl,
    courseRecord.image,
  ];

  for (const candidate of thumbnailCandidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }

  return null;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function CareerChatbot() {
  const { markCoachCompleted } = useAuth();
  const [step, setStep] = useState<number>(0);
  const [answers, setAnswers] = useState<CareerQuestionnaire>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState<RecommendationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCountdown, setRetryCountdown] = useState(0);

  // ── "Autre" popup state ─────────────────────────────────────────────────
  const [showAutrePopup, setShowAutrePopup] = useState(false);
  const [autreInput, setAutreInput] = useState('');
  const [autreKey, setAutreKey] = useState<keyof CareerQuestionnaire | null>(null);
  const [autreIsMulti, setAutreIsMulti] = useState(false);

  // ── Restore session on mount (sessionStorage only — never the DB) ──────
  useEffect(() => {
    try {
      const savedResult  = sessionStorage.getItem('career_coach_result');
      const savedAnswers = sessionStorage.getItem('career_coach_answers');
      if (savedResult && savedAnswers) {
        setAiResult(JSON.parse(savedResult));
        setAnswers(JSON.parse(savedAnswers));
        setStep(STEPS.length + 1);
      }
    } catch {
      // corrupted data — ignore and start fresh
    }
  }, []);

  useEffect(() => {
    if (!import.meta.env.DEV || !aiResult?.recommendedCourses?.length) return;

    const firstCourse = aiResult.recommendedCourses[0] as unknown as Record<string, unknown>;

    console.debug('[CareerChatbot] recommended course thumbnail fields', {
      keys: Object.keys(firstCourse),
      thumbnailUrl: firstCourse.thumbnailUrl,
      thumbnail: firstCourse.thumbnail,
      imageUrl: firstCourse.imageUrl,
      image: firstCourse.image,
    });
  }, [aiResult]);

  const currentStepDef = STEPS[step];
  const totalSteps = STEPS.length;

  // ── Navigate steps ──────────────────────────────────────────────────────
  const handleSelect = (option: string) => {
    const key = currentStepDef.key;

    // Open "Autre" popup
    if (option === 'Autre') {
      setAutreKey(key);
      setAutreIsMulti(!!currentStepDef.multi);
      setAutreInput('');
      setShowAutrePopup(true);
      return;
    }

    if (currentStepDef.multi) {
      const current = (answers[key] as string[]) || [];
      const updated = current.includes(option)
        ? current.filter((s) => s !== option)
        : [...current, option];
      setAnswers((prev) => ({ ...prev, [key]: updated }));
    } else {
      setAnswers((prev) => ({ ...prev, [key]: option }));
      // Auto-advance for single-select
      setTimeout(() => {
        if (step < totalSteps - 1) setStep((s) => s + 1);
        else setStep(totalSteps); // go to final confirmation step
      }, 200);
    }
  };

  const handleAutreConfirm = () => {
    const trimmed = autreInput.trim();
    if (!trimmed || !autreKey) return;

    // Store the custom text in customAnswers
    setAnswers((prev) => ({
      ...prev,
      customAnswers: { ...(prev.customAnswers || {}), [autreKey]: trimmed },
    }));

    // Also inject as selected value
    if (autreIsMulti) {
      const current = (answers[autreKey] as string[]) || [];
      setAnswers((prev) => ({
        ...prev,
        [autreKey]: [...current, `Autre: ${trimmed}`],
        customAnswers: { ...(prev.customAnswers || {}), [autreKey]: trimmed },
      }));
    } else {
      setAnswers((prev) => ({
        ...prev,
        [autreKey]: `Autre: ${trimmed}`,
        customAnswers: { ...(prev.customAnswers || {}), [autreKey]: trimmed },
      }));
      // Auto-advance for single-select
      setTimeout(() => {
        if (step < totalSteps - 1) setStep((s) => s + 1);
        else setStep(totalSteps);
      }, 200);
    }

    setShowAutrePopup(false);
    setAutreInput('');
    setAutreKey(null);
  };

  const handleNext = () => {
    if (step < totalSteps - 1) setStep((s) => s + 1);
    else setStep(totalSteps); // final confirmation step
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const isCurrentAnswered = () => {
    const key = currentStepDef?.key;
    if (!key) return true;
    const val = answers[key];
    if (Array.isArray(val)) return val.length > 0;
    return !!val;
  };

  // ── Submit ──────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    // Hard validation: all fields must be filled before calling the API
    const missing: string[] = [];
    if (!answers.goal)              missing.push('Objectif principal');
    if (!answers.domain)            missing.push('Domaine d\'intérêt');
    if (!answers.level)             missing.push('Niveau actuel');
    if (answers.skills.length === 0) missing.push('Technologies connues');
    if (!answers.availability)      missing.push('Disponibilité hebdomadaire');
    if (!answers.learningStyle)     missing.push('Style d\'apprentissage');
    if (!answers.shortTermGoal)     missing.push('Objectif à court terme');

    if (missing.length > 0) {
      setError(`Veuillez répondre à toutes les questions avant de soumettre. Manquant : ${missing.join(', ')}.`);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await careerApi.getRecommendation(answers);
      setAiResult(res);
      setStep(totalSteps + 1);
      // Persist in sessionStorage so results survive navigation (never stored in DB)
      try {
        sessionStorage.setItem('career_coach_result',  JSON.stringify(res));
        sessionStorage.setItem('career_coach_answers', JSON.stringify(answers));
      } catch { /* storage full — ignore */ }
      // Mark coach as completed (fire-and-forget — don't block UI)
      markCoachCompleted().catch(() => { /* ignore errors silently */ });
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue.');
      if (err.loading) {
        // Model loading — countdown 30s then allow retry
        let t = 30;
        setRetryCountdown(t);
        const interval = setInterval(() => {
          t -= 1;
          setRetryCountdown(t);
          if (t <= 0) clearInterval(interval);
        }, 1000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    sessionStorage.removeItem('career_coach_result');
    sessionStorage.removeItem('career_coach_answers');
    setStep(0);
    setAnswers(EMPTY);
    setAiResult(null);
    setError(null);
    setRetryCountdown(0);
    setShowAutrePopup(false);
    setAutreInput('');
  };

  // ── Render: Result page (full layout — coach is done) ───────────────────
  if (step === totalSteps + 1 && aiResult) {
    const { recommendedCourses, strengths, weaknesses, focusAreas, learningPlan } = aiResult;
    return (
      <StudentLayout>
        <div className="max-w-3xl mx-auto space-y-6">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="flex items-center gap-2 mb-1">
                <Bot className="w-7 h-7 text-indigo-600" />
                Ton Coaching IA
              </h1>
              <p className="text-muted-foreground text-sm">Résultat personnalisé selon ton profil</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleReset} className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Recommencer
            </Button>
          </div>

          {/* Profile summary */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide mb-3">Ton profil</p>
            <div className="flex flex-wrap gap-2">
              {[answers.goal, answers.domain, answers.level, ...(answers.skills.length > 0 ? answers.skills : ['Aucune compétence']), answers.availability, answers.learningStyle, answers.shortTermGoal].map((tag, i) => (
                <span key={i} className="px-2 py-1 bg-white border border-indigo-200 rounded-full text-xs text-indigo-700">{tag}</span>
              ))}
            </div>
          </div>

          {/* ── Recommended courses ── */}
          {recommendedCourses.length > 0 && (
            <div className="bg-white border border-border rounded-xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-100 rounded-lg">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                </div>
                <p className="text-sm font-bold text-indigo-800">
                  Cours recommandés pour toi ({Math.min(recommendedCourses.length, 3)})
                </p>
              </div>
              <div className="flex flex-col gap-3">
                {recommendedCourses.slice(0, 3).map((course) => {
                  const thumbnailUrl = getCourseThumbnailUrl(course);

                  return (
                    <Link
                      key={course.id}
                      to={`/course/${course.id}`}
                      className="group flex gap-4 border border-indigo-200 rounded-xl p-4 bg-indigo-50 hover:bg-indigo-100 hover:border-indigo-400 transition w-full"
                    >
                      {/* Thumbnail */}
                      <div className="w-24 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200">
                        {thumbnailUrl ? (
                          <img
                            src={thumbnailUrl}
                            alt={course.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
                            No image
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex flex-col flex-1 gap-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-sm text-indigo-900 leading-snug group-hover:text-indigo-700">
                            {course.title}
                          </p>
                          <span className="flex-shrink-0 text-xs bg-white border border-indigo-200 text-indigo-600 px-2 py-0.5 rounded-full capitalize">
                            {course.level}
                          </span>
                        </div>

                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                          {course.shortDescription}
                        </p>

                        <span className="text-xs text-indigo-600 font-medium mt-1 group-hover:underline">
                          Voir le cours →
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Analysis title */}
        <div className="bg-white border border-border rounded-xl p-6 shadow-sm space-y-4">  

          <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-100 rounded-lg">
                  <Trophy className="w-5 h-5 text-indigo-500" />
                </div>
                <p className="text-sm font-bold text-indigo-800">Ton analyse personnalisée</p>
          </div>

          
          {/* ── Strengths & Weaknesses ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-100 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-sm font-bold text-emerald-800">Points forts</p>
              </div>
              <ul className="space-y-2">
                {strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-500 shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-100 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                </div>
                <p className="text-sm font-bold text-amber-800">Points à améliorer</p>
              </div>
              <ul className="space-y-2">
                {weaknesses.map((w, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-amber-900">
                    <span className="mt-1.5 w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>

          {/* ── Focus Areas ── */}
          {focusAreas.length > 0 && (
            <div className="bg-white border border-border rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-100 rounded-lg">
                  <Target className="w-4 h-4 text-indigo-600" />
                </div>
                <p className="text-sm font-bold text-indigo-800">Priorités d'apprentissage</p>
              </div>
              <ol className="space-y-2">
                {focusAreas.map((area, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="text-sm text-indigo-900 font-medium">{area}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {learningPlan && (
  <div className="bg-white border border-border rounded-xl p-5 shadow-sm space-y-3">
    <div className="flex items-center gap-2">
      <div className="p-1.5 bg-indigo-100 rounded-lg">
        <BookOpen className="w-4 h-4 text-indigo-600" />
      </div>
      <p className="text-sm font-bold text-indigo-800">
        Ton plan d'apprentissage personnalisé
      </p>
    </div>
    <p className="text-sm text-indigo-900 leading-relaxed">
      {learningPlan}
    </p>
  </div>
)}
</div>
</StudentLayout>
);
  }

  // ── Render: Final confirmation step ──────────────────────────────────────
  if (step === totalSteps) {
    const unanswered = STEPS.filter((s) => {
      const val = answers[s.key];
      return Array.isArray(val) ? val.length === 0 : !val;
    });
    const isReady = unanswered.length === 0;

    return (
      <CoachOnboardingLayout>
        <div className="max-w-xl mx-auto space-y-6">
          <div className="text-center">
            <Bot className="w-12 h-12 mx-auto text-indigo-600 mb-3" />
            <h1 className="mb-1">Générer ton roadmap</h1>
            <p className="text-muted-foreground text-sm">
              Nous allons créer ton analyse personnalisée à partir de tes réponses.
            </p>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
            {STEPS.map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full bg-indigo-500" />
            ))}
            <div className="w-3 h-3 rounded-full border-2 border-indigo-500 bg-indigo-100" />
          </div>

          {/* Unanswered warning */}
          {!isReady && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 space-y-2">
              <p className="text-sm font-semibold text-amber-800">Questions sans réponse :</p>
              <ul className="space-y-1">
                {unanswered.map((s, i) => (
                  <li key={i} className="flex items-center justify-between text-sm text-amber-900">
                    <span>• {s.question}</span>
                    <button
                      type="button"
                      onClick={() => { setError(null); setStep(STEPS.indexOf(s)); }}
                      className="text-xs text-indigo-600 hover:underline font-medium ml-3 shrink-0"
                    >
                      Répondre →
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {isReady && (
            <div className="bg-white border border-border rounded-xl p-6 shadow-sm space-y-3">
              <p className="text-sm font-medium text-foreground">Tout est prêt.</p>
              <p className="text-sm text-muted-foreground">
                Le coach utilisera uniquement tes réponses au questionnaire pour générer tes recommandations.
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
              {error}
              {retryCountdown > 0 && (
                <span className="ml-2 font-medium">Réessaie dans {retryCountdown}s</span>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => setStep(totalSteps - 1)}>
              <ChevronLeft className="w-4 h-4 mr-1" /> Retour
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || retryCountdown > 0 || !isReady}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyse en cours…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Générer mon roadmap
                </>
              )}
            </Button>
          </div>
        </div>
      </CoachOnboardingLayout>
    );
  }

  // ── Render: Questionnaire ────────────────────────────────────────────────
  const progress = ((step + 1) / totalSteps) * 100;
  const currentVal = answers[currentStepDef.key];
  const selectedOptions: string[] = Array.isArray(currentVal) ? (currentVal as string[]) : typeof currentVal === 'string' ? [currentVal] : [];

  return (
    <CoachOnboardingLayout>
      {/* ── Popup "Autre" ────────────────────────────────────────────────── */}
      {showAutrePopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-base flex items-center gap-2">
                <PenLine className="w-4 h-4 text-indigo-600" />
                Précise ta réponse
              </h3>
              <button
                type="button"
                onClick={() => { setShowAutrePopup(false); setAutreInput(''); }}
                className="p-1 hover:bg-accent rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              autoFocus
              type="text"
              value={autreInput}
              onChange={(e) => setAutreInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAutreConfirm(); }}
              placeholder="Écris ta réponse personnalisée..."
              className="w-full px-3 py-2 border border-border rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => { setShowAutrePopup(false); setAutreInput(''); }}
                className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-accent transition"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleAutreConfirm}
                disabled={!autreInput.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition disabled:opacity-50"
              >
                Valider
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <Bot className="w-12 h-12 mx-auto text-indigo-600 mb-3" />
          <h1 className="mb-1">Coach Carrière IA</h1>
          <p className="text-muted-foreground text-sm">
            Réponds à quelques questions pour recevoir ton roadmap personnalisé.
          </p>
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Question {step + 1} sur {totalSteps}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-accent rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question card */}
        <div className="bg-white border border-border rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold">{currentStepDef.question}</h2>

          {currentStepDef.multi && (
            <p className="text-xs text-muted-foreground">Sélectionne tout ce qui s'applique</p>
          )}

          <div className="grid grid-cols-2 gap-3">
            {currentStepDef.options.map((option) => {
              const selected = selectedOptions.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={`px-4 py-3 rounded-lg border text-sm font-medium transition text-left ${
                    selected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'border-border bg-white hover:border-indigo-300 hover:bg-indigo-50'
                  }`}
                >
                  {selected && <CheckCircle2 className="w-3.5 h-3.5 inline mr-1.5 flex-shrink-0" />}
                  {option}
                </button>
              );
            })}
            {/* ── Autre button ── */}
            <button
              type="button"
              onClick={() => handleSelect('Autre')}
              className={`px-4 py-3 rounded-lg border text-sm font-medium transition text-left flex items-center gap-2 ${
                selectedOptions.some(o => o.startsWith('Autre:')) || answers.customAnswers?.[currentStepDef.key]
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'border-dashed border-indigo-300 bg-indigo-50/50 text-indigo-700 hover:border-indigo-400 hover:bg-indigo-50'
              }`}
            >
              <PenLine className="w-3.5 h-3.5 flex-shrink-0" />
              {answers.customAnswers?.[currentStepDef.key]
                ? `Autre: ${answers.customAnswers[currentStepDef.key]}`
                : 'Autre...'}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={handleBack} disabled={step === 0}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Précédent
          </Button>

          {currentStepDef.multi && (
            <Button onClick={handleNext} disabled={!isCurrentAnswered()}>
              Suivant <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </CoachOnboardingLayout>
  );
}
