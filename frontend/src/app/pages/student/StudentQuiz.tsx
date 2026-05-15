import { StudentLayout } from '../../components/StudentLayout';
import { useParams, Link, useNavigate } from 'react-router';
import { FileQuestion, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { quizApi } from '../../../api/quiz.api';

export function StudentQuiz() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetch = lessonId
      ? quizApi.getByLesson(lessonId)
      : courseId ? quizApi.getByCourse(courseId) : Promise.reject();
    fetch
      .then(setQuiz)
      .catch(() => setQuiz(null))
      .finally(() => setLoading(false));
  }, [lessonId, courseId]);

  const handleSubmit = async () => {
    if (!quiz) return;
    const unanswered = quiz.questions.filter((q: any) => answers[q.id] === undefined);
    if (unanswered.length > 0) {
      setError(`Veuillez répondre à toutes les questions (${unanswered.length} manquante${unanswered.length > 1 ? 's' : ''}).`);
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const res = await quizApi.submit(quiz.id, answers);
      setResult({ score: res.score, passed: res.passed });
    } catch {
      setError('Erreur lors de la soumission. Réessayez.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    setAnswers({});
    setResult(null);
    setError('');
  };

  const backUrl = courseId ? `/student/course/${courseId}` : '/student/courses';

  if (loading) {
    return (
      <StudentLayout>
        <div className="max-w-4xl mx-auto py-12 text-center text-muted-foreground">Chargement du quiz...</div>
      </StudentLayout>
    );
  }

  if (!quiz) {
    return (
      <StudentLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <Link to={backUrl} className="text-primary hover:underline text-sm">← Retour</Link>
          <div className="bg-white border border-border rounded-xl p-12 text-center">
            <FileQuestion className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Aucun quiz disponible</h2>
            <p className="text-muted-foreground mb-6">Cette leçon n'a pas encore de quiz associé.</p>
            <Link to={backUrl} className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition">
              Retour au cours
            </Link>
          </div>
        </div>
      </StudentLayout>
    );
  }

  // ── Results screen ───────────────────────────────────────────────────────
  if (result) {
    return (
      <StudentLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          <Link to={backUrl} className="text-primary hover:underline text-sm">← Retour au cours</Link>
          <div className="bg-white border border-border rounded-xl p-8 text-center">
            {result.passed ? (
              <CheckCircle className="w-20 h-20 mx-auto text-green-500 mb-4" />
            ) : (
              <XCircle className="w-20 h-20 mx-auto text-red-500 mb-4" />
            )}
            <h2 className="text-2xl font-bold mb-2">
              {result.passed ? 'Félicitations !' : 'Quiz échoué'}
            </h2>
            <div className={`text-5xl font-bold my-4 ${result.passed ? 'text-green-600' : 'text-red-600'}`}>
              {Math.round(result.score)}%
            </div>
            <p className="text-muted-foreground mb-6">
              {result.passed
                ? 'Vous avez réussi le quiz. La prochaine leçon est maintenant déverrouillée.'
                : `Score minimum requis : 70%. Il vous manque ${Math.ceil(70 - result.score)}%.`}
            </p>
            <div className="flex gap-3 justify-center">
              {result.passed ? (
                <Link
                  to={backUrl}
                  className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition"
                >
                  Continuer le cours <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <button
                  onClick={handleRetry}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition"
                >
                  Réessayer
                </button>
              )}
            </div>
          </div>
        </div>
      </StudentLayout>
    );
  }

  // ── Quiz questions screen ────────────────────────────────────────────────
  const answered = Object.keys(answers).length;
  const total = quiz.questions.length;

  return (
    <StudentLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <Link to={backUrl} className="text-primary hover:underline text-sm">← Retour au cours</Link>
          <h1 className="mt-2 mb-1">Quiz de la leçon</h1>
          <p className="text-muted-foreground text-sm">
            {answered}/{total} réponse{total > 1 ? 's' : ''} — Score minimum requis : <strong>70%</strong>
          </p>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 rounded-full"
            style={{ width: `${total > 0 ? (answered / total) * 100 : 0}%` }}
          />
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {quiz.questions.map((q: any, qi: number) => (
            <div key={q.id} className="bg-white border border-border rounded-xl p-6">
              <p className="font-semibold mb-4">
                <span className="text-primary mr-2">Q{qi + 1}.</span>
                {q.text}
              </p>
              <div className="space-y-3">
                {(q.answers || []).map((ans: string, ai: number) => {
                  const selected = answers[q.id] === ai;
                  return (
                    <label
                      key={ai}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition
                        ${selected
                          ? 'border-primary bg-primary/10 text-primary font-medium'
                          : 'border-border hover:bg-muted/50'
                        }`}
                    >
                      <input
                        type="radio"
                        name={`q-${q.id}`}
                        checked={selected}
                        onChange={() => setAnswers(prev => ({ ...prev, [q.id]: ai }))}
                        className="w-4 h-4 accent-primary"
                      />
                      <span>{ans}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {error && (
          <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>
        )}

        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition font-medium disabled:opacity-50"
          >
            {submitting ? 'Soumission...' : 'Soumettre le quiz'}
          </button>
        </div>
      </div>
    </StudentLayout>
  );
}

