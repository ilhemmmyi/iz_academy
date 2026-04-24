import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router';
import { StudentLayout } from '../../components/StudentLayout';
import { CoachOnboardingLayout } from '../../components/CoachOnboardingLayout';
import {
  Bot,
  ChevronRight,
  ChevronLeft,
  Upload,
  X,
  Loader2,
  Sparkles,
  FileText,
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
import { getAccessToken } from '../../../api/client';
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
    question: 'Quel est ton objectif principal ?',
    options: [
      'Get a job in tech',
      'Improve skills',
      'Switch careers',
      'Build projects',
      'Freelancing',
      'Certification',
    ],
  },
  {
    key: 'field',
    question: "Quel domaine t'intéresse ?",
    options: ['Web Dev', 'AI/ML', 'Data Science', 'UI/UX', 'Mobile', 'Cybersecurity'],
  },
  {
    key: 'level',
    question: 'Quel est ton niveau actuel ?',
    options: ['Beginner', 'Basic', 'Intermediate', 'Advanced'],
  },
  {
    key: 'skills',
    question: 'Quelles compétences tu possèdes déjà ?',
    options: ['HTML/CSS', 'JavaScript', 'Python', 'React', 'Node.js', 'Git', 'Databases', 'None'],
    multi: true,
  },
  {
    key: 'hoursPerWeek',
    question: "Combien d'heures par semaine peux-tu consacrer ?",
    options: ['Less than 5h', '5–10h', '10–20h', '20h+'],
  },
  {
    key: 'learningStyle',
    question: 'Comment préfères-tu apprendre ?',
    options: ['Videos', 'Projects', 'Reading', 'Mentorship'],
  },
  {
    key: 'shortTermGoal',
    question: 'Ton objectif pour les 3–6 prochains mois ?',
    options: ['Portfolio', 'First job', 'Master tech', 'Startup'],
  },
];

const EMPTY: CareerQuestionnaire = {
  goal: '',
  field: '',
  level: '',
  skills: [],
  hoursPerWeek: '',
  learningStyle: '',
  shortTermGoal: '',
  customAnswers: {},
};

// ─── Component ───────────────────────────────────────────────────────────────

export function CareerChatbot() {
  const { markCoachCompleted } = useAuth();
  const [step, setStep] = useState<number>(0);
  const [answers, setAnswers] = useState<CareerQuestionnaire>(EMPTY);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [aiResult, setAiResult] = useState<RecommendationResult | null>(null);
  const [savedAnswers, setSavedAnswers] = useState<CareerQuestionnaire>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [retryCountdown, setRetryCountdown] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── "Autre" popup state ─────────────────────────────────────────────────
  const [showAutrePopup, setShowAutrePopup] = useState(false);
  const [autreInput, setAutreInput] = useState('');
  const [autreKey, setAutreKey] = useState<keyof CareerQuestionnaire | null>(null);
  const [autreIsMulti, setAutreIsMulti] = useState(false);

  // ── Load saved coach data from DB on mount ──────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const token = getAccessToken();
        const saved = await careerApi.getMyCoachData(token);
        if (saved) {
          setAiResult(saved.recommendations);
          setSavedAnswers(saved.answers);
          setAnswers(saved.answers);
          const resultStep = STEPS.length + 1;
          setStep(resultStep);
        }
      } catch {
        // ignore — will fall back to questionnaire
      } finally {
        setInitialLoading(false);
      }
    };
    load();
  }, []);

  const currentStepDef = STEPS[step];
  const totalSteps = STEPS.length; // 7 question steps

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
        else setStep(totalSteps); // go to CV step
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
    else setStep(totalSteps); // CV step
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
    setLoading(true);
    setError(null);
    try {
      const token = getAccessToken();
      const res = await careerApi.getRecommendation(answers, cvFile, token);
      setAiResult(res);
      const nextStep = totalSteps + 1;
      setStep(nextStep);
      try {
        sessionStorage.setItem('career_result', JSON.stringify(res));
        sessionStorage.setItem('career_answers', JSON.stringify(answers));
        sessionStorage.setItem('career_step', String(nextStep));
      } catch { /* ignore storage errors */ }
      // Mark coach as completed (fire-and-forget — don't block UI)
      markCoachCompleted().catch(() => { /* ignore errors silently */ });
      // result step
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
    setStep(0);
    setAnswers(EMPTY);
    setSavedAnswers(EMPTY);
    setCvFile(null);
    setAiResult(null);
    setError(null);
    setRetryCountdown(0);
    setShowAutrePopup(false);
    setAutreInput('');
    // Delete from DB (fire-and-forget)
    const token = getAccessToken();
    careerApi.deleteMyCoachData(token).catch(() => { /* ignore */ });
    try {
      sessionStorage.removeItem('career_result');
      sessionStorage.removeItem('career_answers');
      sessionStorage.removeItem('career_step');
    } catch { /* ignore */ }
  };

  // ── Render: Initial loading from DB ────────────────────────────────────
  if (initialLoading) {
    return (
      <CoachOnboardingLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      </CoachOnboardingLayout>
    );
  }

  // ── Render: Result page (full layout — coach is done) ───────────────────
  if (step === totalSteps + 1 && aiResult) {
    const { recommendedCourses, strengths, weaknesses, focusAreas, learningPlan, cvParsed } = aiResult;
    // Use savedAnswers (loaded from DB) or current answers (just submitted)
    const displayAnswers = savedAnswers.goal ? savedAnswers : answers;
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
              <p className="text-muted-foreground text-sm">
                Résultat personnalisé selon ton profil
                {cvParsed && (
                  <span className="ml-2 inline-flex items-center gap-1 text-teal-600 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> CV analysé
                  </span>
                )}
              </p>
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
              {[displayAnswers.goal, displayAnswers.field, displayAnswers.level, ...(displayAnswers.skills.length > 0 ? displayAnswers.skills : ['No skills yet']), displayAnswers.hoursPerWeek, displayAnswers.learningStyle, displayAnswers.shortTermGoal].map((tag, i) => (
                <span key={i} className="px-2 py-1 bg-white border border-indigo-200 rounded-full text-xs text-indigo-700">{tag}</span>
              ))}
            </div>
          </div>

          {/* Analysis title */}
          <div className="flex items-center gap-3">
            <Trophy className="w-5 h-5 text-indigo-500" />
            <h2 className="text-base font-bold text-foreground">Ton analyse personnalisée</h2>
            <div className="flex-1 h-px bg-border" />
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

          {/* ── Learning Plan ── */}
          {learningPlan && (
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-100 rounded-lg">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                </div>
                <p className="text-sm font-bold text-indigo-800">Ton plan d'apprentissage personnalisé</p>
              </div>
              <p className="text-sm text-indigo-900 leading-relaxed">{learningPlan}</p>
            </div>
          )}

          {/* ── Recommended courses ── */}
          {recommendedCourses.length > 0 && (
            <div className="bg-white border border-border rounded-xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-100 rounded-lg">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                </div>
                <p className="text-sm font-bold text-indigo-800">
                  Cours recommandés pour toi ({recommendedCourses.length})
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recommendedCourses.map((course) => (
                  <Link
                    key={course.id}
                    to={`/course/${course.id}`}
                    className="group flex flex-col gap-1.5 border border-indigo-200 rounded-xl p-4 bg-indigo-50 hover:bg-indigo-100 hover:border-indigo-400 transition"
                  >
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
                  </Link>
                ))}
              </div>
            </div>
          )}

        </div>
      </StudentLayout>
    );
  }

  // ── Render: CV Upload step ───────────────────────────────────────────────
  if (step === totalSteps) {
    return (
      <CoachOnboardingLayout>
        <div className="max-w-xl mx-auto space-y-6">
          <div className="text-center">
            <Bot className="w-12 h-12 mx-auto text-indigo-600 mb-3" />
            <h1 className="mb-1">Ajouter ton CV (optionnel)</h1>
            <p className="text-muted-foreground text-sm">
              Uploade ton CV en PDF pour une analyse encore plus personnalisée.
            </p>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
            {STEPS.map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full bg-indigo-500" />
            ))}
            <div className="w-3 h-3 rounded-full border-2 border-indigo-500 bg-indigo-100" />
          </div>

          {/* Upload box */}
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
              cvFile ? 'border-teal-300 bg-teal-50' : 'border-border hover:border-indigo-300 hover:bg-indigo-50/30'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => setCvFile(e.target.files?.[0] || null)}
            />
            {cvFile ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="w-8 h-8 text-teal-600" />
                <div className="text-left">
                  <p className="font-medium text-sm text-teal-700">{cvFile.name}</p>
                  <p className="text-xs text-muted-foreground">{(cvFile.size / 1024).toFixed(0)} KB</p>
                </div>
                <button
                  type="button"
                  className="ml-2 p-1 hover:bg-teal-100 rounded"
                  onClick={(e) => { e.stopPropagation(); setCvFile(null); }}
                >
                  <X className="w-4 h-4 text-teal-700" />
                </button>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-medium">Clique pour uploader un PDF</p>
                <p className="text-xs text-muted-foreground mt-1">Max 10 MB • PDF uniquement</p>
              </>
            )}
          </div>

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
              disabled={loading || retryCountdown > 0}
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

          <p className="text-center text-xs text-muted-foreground">
            Pas de CV ? Pas de problème — on génère le roadmap sans.
          </p>
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
