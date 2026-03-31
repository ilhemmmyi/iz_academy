import { useState, useEffect } from 'react';
import { TeacherLayout } from '../../components/TeacherLayout';
import { FolderGit2, CheckCircle, AlertCircle, Clock, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { projectsApi } from '../../../api/projects.api';

interface Submission {
  id: string;
  projectId: string;
  courseId: string;
  courseTitle: string;
  githubUrl: string;
  comment?: string;
  status: 'PENDING' | 'VALIDATED' | 'NEEDS_IMPROVEMENT';
  feedback?: string;
  submittedAt: string;
  project: { id: string; title: string };
  student: { id: string; name: string; email: string };
}

const STATUS: Record<Submission['status'], { label: string; cls: string; dot: string }> = {
  PENDING:           { label: 'En attente',  cls: 'bg-amber-50 text-amber-700',   dot: 'bg-amber-400' },
  VALIDATED:         { label: 'Validé',      cls: 'bg-teal-50 text-teal-700',     dot: 'bg-teal-500' },
  NEEDS_IMPROVEMENT: { label: 'À améliorer', cls: 'bg-violet-50 text-violet-700', dot: 'bg-violet-500' },
};

export function TeacherProjects() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [decision, setDecision] = useState<'VALIDATED' | 'NEEDS_IMPROVEMENT'>('VALIDATED');
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<'ALL' | Submission['status']>('ALL');

  useEffect(() => {
    projectsApi.teacherSubmissions()
      .then((data: Submission[]) => setSubmissions(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async (id: string) => {
    setSaving(true);
    try {
      const updated: Submission = await projectsApi.review(id, { status: decision, feedback: feedback.trim() || undefined });
      setSubmissions(prev => prev.map(s => s.id === id ? { ...s, ...updated } : s));
      setOpenId(null);
      setFeedback('');
    } catch {}
    finally { setSaving(false); }
  };

  const pending  = submissions.filter(s => s.status === 'PENDING').length;
  const valid    = submissions.filter(s => s.status === 'VALIDATED').length;
  const improve  = submissions.filter(s => s.status === 'NEEDS_IMPROVEMENT').length;
  const list     = filter === 'ALL' ? submissions : submissions.filter(s => s.status === filter);

  return (
    <TeacherLayout>
      <div className="space-y-6">

        {/* Header */}
        <div>
          <h1 className="mb-1">Projets des étudiants</h1>
          <p className="text-sm text-muted-foreground">Évaluez les projets soumis par vos étudiants</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-teal-100 border-l-4 border-l-teal-400 rounded-xl p-5 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-teal-50 rounded-lg"><CheckCircle className="w-6 h-6 text-teal-600" /></div>
            <div>
              <div className="text-2xl font-bold text-teal-700">{valid}</div>
              <div className="text-sm text-muted-foreground">Validés</div>
            </div>
          </div>
          <div className="bg-white border border-violet-100 border-l-4 border-l-violet-400 rounded-xl p-5 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-violet-50 rounded-lg"><AlertCircle className="w-6 h-6 text-violet-600" /></div>
            <div>
              <div className="text-2xl font-bold text-violet-700">{improve}</div>
              <div className="text-sm text-muted-foreground">À améliorer</div>
            </div>
          </div>
          <div className="bg-white border border-amber-100 border-l-4 border-l-amber-400 rounded-xl p-5 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-amber-50 rounded-lg"><Clock className="w-6 h-6 text-amber-600" /></div>
            <div>
              <div className="text-2xl font-bold text-amber-700">{pending}</div>
              <div className="text-sm text-muted-foreground">En attente</div>
            </div>
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 flex-wrap">
          {(['ALL', 'PENDING', 'VALIDATED', 'NEEDS_IMPROVEMENT'] as const).map(k => {
            const labels: Record<string, string> = { ALL: 'Tous', PENDING: 'En attente', VALIDATED: 'Validés', NEEDS_IMPROVEMENT: 'À améliorer' };
            const count = k === 'ALL' ? submissions.length : k === 'PENDING' ? pending : k === 'VALIDATED' ? valid : improve;
            return (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition ${
                  filter === k ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
                }`}
              >
                {labels[k]} <span className={`ml-1 text-xs ${filter === k ? 'text-indigo-200' : 'text-gray-400'}`}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* List */}
        {loading ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400 shadow-sm">Chargement…</div>
        ) : list.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center shadow-sm">
            <FolderGit2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Aucune soumission</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-100 overflow-hidden">
            {list.map(sub => {
              const s = STATUS[sub.status];
              const isOpen = openId === sub.id;
              return (
                <div key={sub.id}>
                  {/* Row */}
                  <div className="px-5 py-4 flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold flex items-center justify-center flex-shrink-0">
                      {sub.student.name.slice(0, 2).toUpperCase()}
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-800 truncate">{sub.student.name}
                        <span className="font-normal text-gray-400 ml-2">— {sub.project.title}</span>
                      </p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{sub.courseTitle} · {new Date(sub.submittedAt).toLocaleDateString('fr-FR')}</p>
                    </div>

                    {/* GitHub */}
                    <a href={sub.githubUrl} target="_blank" rel="noopener noreferrer"
                      className="hidden sm:flex items-center gap-1 text-xs text-indigo-600 hover:underline flex-shrink-0"
                      onClick={e => e.stopPropagation()}
                    >
                      <FolderGit2 className="w-3.5 h-3.5" />
                      GitHub
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    {/* Status badge */}
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${s.cls}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                      {s.label}
                    </span>

                    {/* Toggle */}
                    <button
                      onClick={() => { setOpenId(isOpen ? null : sub.id); setDecision('VALIDATED'); setFeedback(sub.feedback || ''); }}
                      className="flex-shrink-0 text-gray-400 hover:text-indigo-600 transition"
                    >
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Expandable panel */}
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 bg-gray-50 border-t border-gray-100 space-y-4">
                      {sub.comment && (
                        <p className="text-sm text-gray-600 bg-white rounded-lg px-4 py-3 border border-gray-100">
                          <span className="font-medium text-gray-700">Commentaire : </span>{sub.comment}
                        </p>
                      )}
                      {sub.feedback && (
                        <p className="text-sm text-indigo-700 bg-indigo-50 rounded-lg px-4 py-3">
                          <span className="font-medium">Retour envoyé : </span>{sub.feedback}
                        </p>
                      )}

                      {sub.status === 'VALIDATED' ? (
                        /* Already validated — read-only */
                        <div className="flex items-center gap-2 text-sm text-teal-700 bg-teal-50 border border-teal-200 rounded-lg px-4 py-3">
                          <CheckCircle className="w-4 h-4 flex-shrink-0" />
                          Ce projet a déjà été validé. Aucune action supplémentaire n'est possible.
                        </div>
                      ) : (
                        /* PENDING or NEEDS_IMPROVEMENT — allow review */
                        <>
                          <textarea
                            rows={3}
                            placeholder="Retour pour l'étudiant (optionnel)…"
                            value={feedback}
                            onChange={e => setFeedback(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => setDecision('VALIDATED')}
                              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition ${
                                decision === 'VALIDATED' ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-teal-600 border-teal-200 hover:border-teal-400'
                              }`}
                            >
                              <CheckCircle className="w-4 h-4" /> Valider
                            </button>
                            <button
                              onClick={() => setDecision('NEEDS_IMPROVEMENT')}
                              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition ${
                                decision === 'NEEDS_IMPROVEMENT' ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-violet-600 border-violet-200 hover:border-violet-400'
                              }`}
                            >
                              <AlertCircle className="w-4 h-4" /> À améliorer
                            </button>
                            <button
                              onClick={() => save(sub.id)}
                              disabled={saving}
                              className="ml-auto px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50"
                            >
                              {saving ? 'Envoi…' : 'Envoyer'}
                            </button>
                            <button
                              onClick={() => setOpenId(null)}
                              className="px-4 py-2 bg-white text-gray-500 rounded-lg text-sm border border-gray-200 hover:bg-gray-50 transition"
                            >
                              Annuler
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </TeacherLayout>
  );
}
