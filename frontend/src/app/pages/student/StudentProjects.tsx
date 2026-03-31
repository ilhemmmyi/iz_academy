import { StudentLayout } from '../../components/StudentLayout';
import { FolderKanban, ArrowLeft, Send, CheckCircle, AlertCircle, Clock, ExternalLink, Trash2, Lock } from 'lucide-react';
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
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showResubmitForm, setShowResubmitForm] = useState(false);
  const [now, setNow] = useState(Date.now());

  // Tick every second to drive countdowns
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const GRACE_MS = 3 * 60 * 1000;
  const isLocked = (sub: Submission) => (now - new Date(sub.submittedAt).getTime()) >= GRACE_MS;
  const remainingMs = (sub: Submission) => Math.max(0, GRACE_MS - (now - new Date(sub.submittedAt).getTime()));
  const fmtCountdown = (ms: number) => {
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${m}:${String(s).padStart(2, '0')}`;
  };

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

  const isGithubUrl = (url: string) => {
    try {
      const parsed = new URL(url.trim());
      return parsed.hostname === 'github.com' || parsed.hostname === 'www.github.com';
    } catch {
      return false;
    }
  };

  const handleSubmitConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !githubUrl.trim()) return;
    if (!isGithubUrl(githubUrl)) {
      setSubmitError('Veuillez entrer un lien GitHub valide (https://github.com/...)');
      return;
    }
    setSubmitError('');
    setShowConfirm(true);
  };

  const handleSubmit = async () => {
    if (!selected) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const sub = await projectsApi.submit(selected.id, { githubUrl: githubUrl.trim(), comment: comment.trim() || undefined });
      setSubmissions(prev => {
        const existing = prev.findIndex(s => s.projectId === selected.id);
        if (existing >= 0) { const updated = [...prev]; updated[existing] = sub; return updated; }
        return [...prev, sub];
      });
      setShowSubmitForm(false);
      setShowEditForm(false);
      setShowResubmitForm(false);
      setShowConfirm(false);
      setGithubUrl('');
      setComment('');
    } catch (err: any) {
      setSubmitError(err.message || 'Erreur lors de la soumission.');
      setShowConfirm(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (submissionId: string) => {
    setDeleting(true);
    try {
      await projectsApi.deleteSubmission(submissionId);
      setSubmissions(prev => prev.filter(s => s.id !== submissionId));
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la suppression.');
    } finally {
      setDeleting(false);
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

        {/* ── Confirmation dialog ── */}
        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4 space-y-4">
              <h3 className="text-lg font-semibold">Confirmer l'envoi</h3>
              <p className="text-sm text-muted-foreground">
                Votre projet sera enregistré maintenant. Vous aurez <strong>15 minutes</strong> pour le modifier ou le supprimer avant qu'il soit envoyé définitivement à votre formateur.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-accent transition text-sm"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition flex items-center gap-2 text-sm disabled:opacity-60"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? 'Envoi...' : 'Oui, envoyer'}
                </button>
              </div>
            </div>
          </div>
        )}
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

                  {/* Grace period zone */}
                  <div className="border-t border-border pt-3">
                    {isLocked(getSubmission(selected.id)!) ? (
                      <div className="inline-flex items-center gap-1.5 text-sm text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg">
                        <Lock className="w-3.5 h-3.5" />
                        Envoyé au formateur
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="inline-flex items-center gap-1.5 text-sm text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg">
                            <Clock className="w-3.5 h-3.5" />
                            Envoi au formateur dans{' '}
                            <strong>{fmtCountdown(remainingMs(getSubmission(selected.id)!))}</strong>
                          </div>
                          <div className="flex items-center gap-3">
                            {!showEditForm && (
                              <button
                                onClick={() => {
                                  setGithubUrl(getSubmission(selected.id)!.githubUrl);
                                  setComment(getSubmission(selected.id)!.comment || '');
                                  setSubmitError('');
                                  setShowEditForm(true);
                                }}
                                className="text-sm text-primary hover:underline font-medium"
                              >
                                Modifier
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(getSubmission(selected.id)!.id)}
                              disabled={deleting}
                              className="inline-flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 disabled:opacity-50 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                              {deleting ? 'Suppression...' : 'Supprimer'}
                            </button>
                          </div>
                        </div>

                        {/* Inline edit form */}
                        {showEditForm && (
                          <form onSubmit={handleSubmitConfirm} className="space-y-3 pt-2 border-t border-border">
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
                                className={`w-full px-3 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary text-sm ${
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
                                rows={2}
                                value={comment}
                                onChange={e => setComment(e.target.value)}
                                placeholder="Décrivez ce que vous avez réalisé..."
                                className="w-full px-3 py-2 border border-border rounded-lg bg-white resize-none focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="submit"
                                disabled={submitting || !isGithubUrl(githubUrl)}
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition flex items-center gap-2 text-sm disabled:opacity-60"
                              >
                                <Send className="w-4 h-4" />
                                {submitting ? 'Envoi...' : 'Mettre à jour'}
                              </button>
                              <button
                                type="button"
                                onClick={() => { setShowEditForm(false); setSubmitError(''); }}
                                className="px-4 py-2 border border-border rounded-lg hover:bg-accent transition text-sm"
                              >
                                Annuler
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    )}
                  </div>
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

            {/* Submit form — only shown when no submission exists yet */}
            {allLessonsCompleted && !getSubmission(selected.id) && (
              <div className="border-t border-border pt-4">
                {!showSubmitForm ? (
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

