import { StudentLayout } from '../../components/StudentLayout';
import { FolderKanban, ArrowLeft, Send, CheckCircle, AlertCircle, Clock, ExternalLink } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { useEffect, useState } from 'react';
import { projectsApi } from '../../../api/projects.api';
import { coursesApi } from '../../../api/courses.api';

type Project = {
  id: string;
  title: string;
  description: string;
  instructions: string;
};

type Submission = {
  id: string;
  projectId: string;
  githubUrl: string;
  comment?: string;
  status: 'PENDING' | 'VALIDATED' | 'NEEDS_IMPROVEMENT';
  feedback?: string;
  submittedAt: string;
};

export function StudentProjects() {
  const { courseId } = useParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [allLessonsCompleted, setAllLessonsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Project | null>(null);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [githubUrl, setGithubUrl] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [showResubmitForm, setShowResubmitForm] = useState(false);

  useEffect(() => {
    if (!courseId) { setLoading(false); return; }
    Promise.all([
      projectsApi.getByCourse(courseId),
      projectsApi.mySubmissions(),
      coursesApi.getProgress(courseId).catch(() => ({ completedLessonIds: [] })),
      coursesApi.getById(courseId).catch(() => null),
    ]).then(([proj, subs, progress, course]) => {
      setProjects(proj as Project[]);
      setSubmissions((subs as Submission[]).filter((s: Submission) => s.projectId && proj.some((p: Project) => p.id === s.projectId)));
      if (course) {
        const allLessons = (course.modules || []).flatMap((m: any) => m.lessons || []);
        setAllLessonsCompleted(
          allLessons.length > 0 &&
          allLessons.every((l: any) => (progress.completedLessonIds || []).includes(l.id))
        );
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [courseId]);

  const getSubmission = (projectId: string) => submissions.find(s => s.projectId === projectId);

  // True if the student already has ANY submission for this course (regardless of which project)
  // Resubmission is only allowed when the existing submission is NEEDS_IMPROVEMENT
  const courseSubmission = submissions.length > 0 ? submissions[0] : null;
  const hasBlockingCourseSubmission = courseSubmission !== null && courseSubmission.status !== 'NEEDS_IMPROVEMENT';

  const isGithubUrl = (url: string) => {
    try {
      const parsed = new URL(url.trim());
      return parsed.hostname === 'github.com' || parsed.hostname === 'www.github.com';
    } catch {
      return false;
    }
  };

  const handleSubmitConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !githubUrl.trim()) return;
    if (!isGithubUrl(githubUrl)) {
      setSubmitError('Veuillez entrer un lien GitHub valide (https://github.com/...)');
      return;
    }
    setSubmitError('');
    setSubmitting(true);
    try {
      const sub = await projectsApi.submit(selected.id, { githubUrl: githubUrl.trim(), comment: comment.trim() || undefined });
      setSubmissions(prev => {
        const existing = prev.findIndex(s => s.projectId === selected.id);
        if (existing >= 0) { const updated = [...prev]; updated[existing] = sub; return updated; }
        return [...prev, sub];
      });
      setShowSubmitForm(false);
      setShowResubmitForm(false);
      setGithubUrl('');
      setComment('');
    } catch (err: any) {
      setSubmitError(err.message || 'Erreur lors de la soumission.');
    } finally {
      setSubmitting(false);
    }
  };

  const statusBadge = (status: string) => {
    if (status === 'VALIDATED') return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200">
        <CheckCircle className="w-3 h-3" /> Validé
      </span>
    );
    if (status === 'NEEDS_IMPROVEMENT') return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
        <AlertCircle className="w-3 h-3" /> À améliorer
      </span>
    );
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
        <Clock className="w-3 h-3" /> En attente
      </span>
    );
  };

  return (
    <StudentLayout>
      <div className="max-w-4xl mx-auto space-y-6">

        <div>
          {courseId && (
            <Link to={`/student/course/${courseId}`} className="text-primary hover:underline inline-flex items-center gap-1 mb-2 text-sm">
              <ArrowLeft className="w-4 h-4" />
              Retour au cours
            </Link>
          )}
          <h1 className="mb-1">Projets du cours</h1>
          <p className="text-muted-foreground">Choisissez un projet à réaliser pour valider vos compétences</p>
        </div>

        {!allLessonsCompleted && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm text-yellow-800">
            <strong>Leçons non complétées :</strong> Vous devez terminer toutes les leçons du cours pour pouvoir soumettre un projet.
          </div>
        )}

        {loading ? (
          <div className="bg-white border border-border rounded-xl p-12 text-center text-muted-foreground">
            Chargement des projets...
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-white border border-border rounded-xl p-12 text-center">
            <FolderKanban className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Aucun projet disponible</h2>
            <p className="text-muted-foreground">Aucun projet n'a encore été ajouté pour ce cours.</p>
          </div>
        ) : selected ? (
          <div className="bg-white border border-border rounded-xl p-6 space-y-4">
            <button onClick={() => { setSelected(null); setShowSubmitForm(false); setSubmitError(''); }}
              className="text-primary hover:underline inline-flex items-center gap-1 text-sm">
              <ArrowLeft className="w-4 h-4" /> Retour aux projets
            </button>
            <h2 className="text-xl font-semibold">{selected.title}</h2>
            <p className="text-muted-foreground">{selected.description}</p>
            <div className="border-t border-border pt-4">
              <h3 className="font-semibold mb-2">Instructions</h3>
              <p className="text-sm whitespace-pre-wrap">{selected.instructions}</p>
            </div>

            {getSubmission(selected.id) && (
              <div className="border-t border-border pt-4">
                <h3 className="font-semibold mb-3">Ma soumission</h3>
                <div className="bg-accent/40 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    {statusBadge(getSubmission(selected.id)!.status)}
                    <span className="text-xs text-muted-foreground">
                      {new Date(getSubmission(selected.id)!.submittedAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <a href={getSubmission(selected.id)!.githubUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                    <ExternalLink className="w-3.5 h-3.5" />
                    {getSubmission(selected.id)!.githubUrl}
                  </a>
                  {getSubmission(selected.id)!.comment && (
                    <p className="text-sm text-muted-foreground">{getSubmission(selected.id)!.comment}</p>
                  )}
                  {getSubmission(selected.id)!.feedback && (
                    <div className="text-sm text-muted-foreground border-t border-border pt-2">
                      <span className="font-medium">Retour du formateur : </span>
                      {getSubmission(selected.id)!.feedback}
                    </div>
                  )}

                  {getSubmission(selected.id)!.status === 'PENDING' && (
                    <div className="border-t border-border pt-3">
                      <div className="inline-flex items-center gap-1.5 text-sm text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Envoyé au formateur
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Resubmit form — shown when teacher requested improvement */}
            {allLessonsCompleted && getSubmission(selected.id)?.status === 'NEEDS_IMPROVEMENT' && (
              <div className="border-t-2 border-dashed border-orange-300 pt-4 mt-2">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-4 h-4 text-orange-500" />
                  <h3 className="font-semibold text-orange-700">Soumettre une nouvelle version</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Votre formateur vous a demandé d'améliorer votre projet. Soumettez une nouvelle version ci-dessous.
                </p>
                {!showResubmitForm ? (
                  <button
                    onClick={() => {
                      setGithubUrl(getSubmission(selected.id)!.githubUrl);
                      setComment(getSubmission(selected.id)!.comment || '');
                      setSubmitError('');
                      setShowResubmitForm(true);
                    }}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition flex items-center gap-2 text-sm"
                  >
                    <Send className="w-4 h-4" />
                    Soumettre une nouvelle version
                  </button>
                ) : (
                  <form onSubmit={handleSubmitConfirm} className="space-y-4 bg-orange-50 border border-orange-200 rounded-xl p-4">
                    {submitError && (
                      <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{submitError}</div>
                    )}
                    <div>
                      <label className="block text-sm font-medium mb-1">Lien GitHub *</label>
                      <input
                        required
                        type="url"
                        value={githubUrl}
                        onChange={e => { setGithubUrl(e.target.value); setSubmitError(''); }}
                        placeholder="https://github.com/votre-repo"
                        className={`w-full px-3 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm ${
                          githubUrl && !isGithubUrl(githubUrl) ? 'border-red-400' : 'border-border'
                        }`}
                      />
                      {githubUrl && !isGithubUrl(githubUrl) && (
                        <p className="text-xs text-red-600 mt-1">Le lien doit être une URL GitHub (https://github.com/...)</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Commentaire (optionnel)</label>
                      <textarea
                        rows={3}
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        placeholder="Décrivez les améliorations apportées..."
                        className="w-full px-3 py-2 border border-border rounded-lg bg-white resize-none focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={submitting || !isGithubUrl(githubUrl)}
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition flex items-center gap-2 text-sm disabled:opacity-60"
                      >
                        <Send className="w-4 h-4" />
                        {submitting ? 'Envoi...' : 'Envoyer la nouvelle version'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowResubmitForm(false); setSubmitError(''); }}
                        className="px-4 py-2 border border-border rounded-lg hover:bg-accent transition text-sm"
                      >
                        Annuler
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Submit form — only shown when no submission exists for THIS project yet */}
            {allLessonsCompleted && !getSubmission(selected.id) && (
              <div className="border-t border-border pt-4">
                {hasBlockingCourseSubmission ? (
                  /* Student already submitted a different project for this course */
                  <div className="inline-flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    Vous avez déjà soumis un projet pour ce cours. Une seule soumission est autorisée.
                  </div>
                ) : !showSubmitForm ? (
                  <button
                    onClick={() => setShowSubmitForm(true)}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition flex items-center gap-2 text-sm"
                  >
                    <Send className="w-4 h-4" />
                    Soumettre le projet
                  </button>
                ) : (
                  <form onSubmit={handleSubmitConfirm} className="space-y-4">
                    <h3 className="font-semibold">Soumettre votre projet</h3>
                    {submitError && (
                      <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{submitError}</div>
                    )}
                    <div>
                      <label className="block text-sm font-medium mb-1">Lien GitHub *</label>
                      <input
                        required
                        type="url"
                        value={githubUrl}
                        onChange={e => { setGithubUrl(e.target.value); setSubmitError(''); }}
                        placeholder="https://github.com/votre-repo"
                        className={`w-full px-3 py-2 border rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-primary text-sm ${
                          githubUrl && !isGithubUrl(githubUrl) ? 'border-red-400' : 'border-border'
                        }`}
                      />
                      {githubUrl && !isGithubUrl(githubUrl) && (
                        <p className="text-xs text-red-600 mt-1">Le lien doit être une URL GitHub (https://github.com/...)</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Commentaire (optionnel)</label>
                      <textarea
                        rows={3}
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        placeholder="Décrivez ce que vous avez réalisé..."
                        className="w-full px-3 py-2 border border-border rounded-lg bg-input-background resize-none focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button type="submit" disabled={submitting || !isGithubUrl(githubUrl)}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition flex items-center gap-2 text-sm disabled:opacity-60">
                        <Send className="w-4 h-4" />
                        {submitting ? 'Envoi...' : 'Envoyer'}
                      </button>
                      <button type="button" onClick={() => { setShowSubmitForm(false); setSubmitError(''); }}
                        className="px-4 py-2 border border-border rounded-lg hover:bg-accent transition text-sm">
                        Annuler
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {projects.map(project => {
              const sub = getSubmission(project.id);
              return (
                <div key={project.id}
                  className="bg-white border border-indigo-100 border-l-4 border-l-indigo-400 rounded-xl p-6 shadow-sm hover:shadow-md transition cursor-pointer"
                  onClick={() => setSelected(project)}>
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-indigo-50 rounded-lg">
                      <FolderKanban className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold">{project.title}</h3>
                        {sub && statusBadge(sub.status)}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                    </div>
                    <span className="text-primary text-sm font-medium flex-shrink-0">Voir →</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}

