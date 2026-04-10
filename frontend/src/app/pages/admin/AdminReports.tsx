import { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import {
  Flag,
  AlertCircle,
  CheckCircle2,
  Clock,
  MessageSquare,
  MessageCircle,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { Skeleton } from '../../components/ui/skeleton';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';
import { reportsApi } from '../../../api/reports.api';

// ─── Types ────────────────────────────────────────────────────────────────────

type Reporter = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type ReportedMessage = {
  id: string;
  content: string;
  senderId: string;
} | null;

type ReportedComment = {
  id: string;
  content: string;
  authorId: string;
  lessonId: string;
} | null;

type Report = {
  id: string;
  reason: string;
  status: 'PENDING' | 'REVIEWED';
  reporterId: string;
  messageId: string | null;
  commentId: string | null;
  reporter: Reporter;
  message: ReportedMessage;
  comment: ReportedComment;
  createdAt: string;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'REVIEWED'>('ALL');
  const [markingId, setMarkingId] = useState<string | null>(null);

  useEffect(() => {
    reportsApi.getAll()
      .then(data => setReports(data as Report[]))
      .catch(() => setError('Impossible de charger les signalements.'))
      .finally(() => setLoading(false));
  }, []);

  const handleMarkReviewed = async (report: Report) => {
    if (report.status === 'REVIEWED') return;
    setMarkingId(report.id);
    try {
      const updated = await reportsApi.markReviewed(report.id) as Report;
      setReports(prev => prev.map(r => r.id === report.id ? { ...r, status: updated.status } : r));
      toast.success('Signalement marqué comme traité.');
    } catch {
      toast.error('Erreur lors de la mise à jour.');
    } finally {
      setMarkingId(null);
    }
  };

  const filtered = reports.filter(r =>
    filterStatus === 'ALL' || r.status === filterStatus,
  );

  const pendingCount = reports.filter(r => r.status === 'PENDING').length;

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-6">

        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-50 rounded-xl">
                <Flag className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-700">Signalements</h1>
                <p className="text-slate-400 text-sm mt-0.5">
                  Gérez les contenus signalés par les utilisateurs
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {pendingCount > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-medium">
                  <Clock className="w-4 h-4" />
                  {pendingCount} en attente
                </span>
              )}
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value as any)}
                className="px-3 py-2 border border-border rounded-lg bg-accent/30 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="ALL">Tous les signalements</option>
                <option value="PENDING">En attente</option>
                <option value="REVIEWED">Traités</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* ── List ──────────────────────────────────────────────────────────── */}
        <div className="space-y-3">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white border border-border rounded-xl p-5 space-y-3">
                <div className="flex justify-between items-start">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="bg-white border border-border rounded-xl p-12 text-center">
              <Flag className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-30" />
              <p className="text-muted-foreground">
                {filterStatus === 'ALL' ? 'Aucun signalement pour l\'instant.' : `Aucun signalement ${filterStatus === 'PENDING' ? 'en attente' : 'traité'}.`}
              </p>
            </div>
          ) : (
            filtered.map(report => (
              <div
                key={report.id}
                className={`bg-white border rounded-xl p-5 shadow-sm transition-colors ${
                  report.status === 'PENDING'
                    ? 'border-red-200 border-l-4 border-l-red-400'
                    : 'border-border border-l-4 border-l-emerald-400'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">

                  {/* Left: reporter info */}
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{report.reporter.name}</span>
                      <span className="text-xs text-muted-foreground">{report.reporter.email}</span>
                      <Badge
                        className={`text-xs ${
                          report.reporter.role === 'STUDENT'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : 'bg-teal-50 text-teal-700 border-teal-200'
                        }`}
                      >
                        {report.reporter.role === 'STUDENT' ? 'Étudiant' : 'Formateur'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {new Date(report.createdAt).toLocaleDateString('fr-FR', {
                        day: '2-digit', month: 'long', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                      {report.messageId && (
                        <span className="ml-2 inline-flex items-center gap-1 text-violet-600">
                          <MessageSquare className="w-3 h-3" /> Message
                        </span>
                      )}
                      {report.commentId && (
                        <span className="ml-2 inline-flex items-center gap-1 text-indigo-600">
                          <MessageCircle className="w-3 h-3" /> Commentaire
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: status + action */}
                  <div className="flex items-center gap-2 shrink-0">
                    {report.status === 'PENDING' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border bg-amber-50 text-amber-700 border-amber-200">
                        <Clock className="w-3 h-3" />
                        En attente
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border bg-emerald-50 text-emerald-700 border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        Traité
                      </span>
                    )}
                    {report.status === 'PENDING' && (
                      <button
                        onClick={() => handleMarkReviewed(report)}
                        disabled={markingId === report.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition disabled:opacity-60"
                      >
                        {markingId === report.id
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : <ShieldCheck className="w-3 h-3" />
                        }
                        Marquer comme traité
                      </button>
                    )}
                  </div>
                </div>

                {/* Reason */}
                <div className="mt-3 bg-red-50 border border-red-100 rounded-lg px-4 py-2.5">
                  <p className="text-xs font-medium text-red-700 mb-0.5">Raison du signalement</p>
                  <p className="text-sm text-red-900">{report.reason}</p>
                </div>

                {/* Reported content preview */}
                {(report.message || report.comment) && (
                  <div className="mt-2 bg-accent/40 border border-border rounded-lg px-4 py-2.5">
                    <p className="text-xs font-medium text-muted-foreground mb-0.5">Contenu signalé</p>
                    <p className="text-sm text-foreground line-clamp-3">
                      {report.message?.content ?? report.comment?.content ?? '—'}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
