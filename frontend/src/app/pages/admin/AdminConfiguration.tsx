import { useState, useEffect, useMemo } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import {
  FolderTree, Mail, Flag, CreditCard, Settings,
  Plus, Edit, Trash2, X, Tag,
  MailCheck, Send, Inbox, Clock, CheckCheck, User, AtSign, MessageSquare, ChevronDown,
  AlertCircle, CheckCircle2, MessageCircle, Loader2, ShieldCheck,
  Search, Download, TrendingUp, Euro, Save,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { coursesApi } from '../../../api/courses.api';
import { contactApi, type ContactMessage } from '../../../api/contact.api';
import { reportsApi } from '../../../api/reports.api';
import { paymentsApi } from '../../../api/payments.api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// ─────────────────────────────────────────────────────────────────────────────
// CATÉGORIES
// ─────────────────────────────────────────────────────────────────────────────

interface Category { id: string; name: string; slug: string; }

function CategoriesSection() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    coursesApi.getCategories()
      .then(data => setCategories(data))
      .catch(() => toast.error('Impossible de charger les catégories'))
      .finally(() => setLoading(false));
  }, []);

  const openCreate = () => { setEditing(null); setNameInput(''); setModalOpen(true); };
  const openEdit = (cat: Category) => { setEditing(cat); setNameInput(cat.name); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setNameInput(''); setEditing(null); };

  const handleSave = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) { toast.error('Le nom est requis'); return; }
    setSaving(true);
    try {
      if (editing) {
        const updated = await coursesApi.updateCategory(editing.id, trimmed);
        setCategories(cats => cats.map(c => c.id === editing.id ? updated : c));
        toast.success('Catégorie modifiée');
      } else {
        const created = await coursesApi.createCategory(trimmed);
        setCategories(cats => [...cats, created]);
        toast.success('Catégorie ajoutée');
      }
      closeModal();
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await coursesApi.deleteCategory(deleteTarget.id);
      setCategories(cats => cats.filter(c => c.id !== deleteTarget.id));
      toast.success('Catégorie supprimée');
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 pt-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Catégories de cours</h2>
          <p className="text-sm text-muted-foreground">Organisez vos cours par catégorie</p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          Ajouter une catégorie
        </button>
      </div>

      {loading ? (
        <div className="text-muted-foreground text-sm py-10 text-center">Chargement…</div>
      ) : categories.length === 0 ? (
        <div className="bg-white border border-border rounded-xl p-12 text-center">
          <Tag className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-40" />
          <p className="text-muted-foreground">Aucune catégorie. Créez la première !</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {categories.map(cat => (
            <div key={cat.id} className="bg-white border border-indigo-100 border-l-4 border-l-indigo-400 rounded-xl p-5 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <Tag className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="font-medium">{cat.name}</p>
                  <p className="text-xs text-muted-foreground">{cat.slug}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => openEdit(cat)} className="p-2 hover:bg-accent rounded-lg transition" title="Modifier">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => setDeleteTarget(cat)} className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition" title="Supprimer">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{editing ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</h3>
              <button onClick={closeModal} className="p-1 hover:bg-accent rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Nom *</label>
              <input
                autoFocus
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSave()}
                placeholder="Ex: Développement Web"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button onClick={closeModal} className="px-4 py-2 rounded-lg border border-border hover:bg-accent transition text-sm">Annuler</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition text-sm disabled:opacity-60">
                {saving ? 'Enregistrement…' : editing ? 'Enregistrer' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6 space-y-4">
            <h3 className="text-lg font-semibold">Supprimer la catégorie</h3>
            <p className="text-sm text-muted-foreground">
              Voulez-vous vraiment supprimer <strong>{deleteTarget.name}</strong> ? Cette action est irréversible.
            </p>
            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 rounded-lg border border-border hover:bg-accent transition text-sm">Annuler</button>
              <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition text-sm disabled:opacity-60">
                {deleting ? 'Suppression…' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MESSAGES DE CONTACT
// ─────────────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 5;

function ContactSection() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    contactApi.getAll()
      .then(data => { setMessages(data); if (data[0]) setSelectedId(data[0].id); })
      .catch(() => toast.error('Impossible de charger les messages de contact'))
      .finally(() => setLoading(false));
  }, []);

  const selectedMessage = useMemo(() => messages.find(m => m.id === selectedId) ?? null, [messages, selectedId]);

  useEffect(() => {
    if (!selectedMessage || selectedMessage.isRead) return;
    contactApi.markRead(selectedMessage.id)
      .then(() => setMessages(curr => curr.map(m => m.id === selectedMessage.id ? { ...m, isRead: true } : m)))
      .catch(() => {});
  }, [selectedMessage]);

  useEffect(() => { setReplyMessage(selectedMessage?.replyMessage || ''); }, [selectedMessage?.id]);

  const handleReply = async () => {
    if (!selectedMessage) return;
    const trimmed = replyMessage.trim();
    if (!trimmed) { toast.error('La réponse ne peut pas être vide'); return; }
    setSending(true);
    try {
      const updated = await contactApi.reply(selectedMessage.id, trimmed);
      setMessages(curr => curr.map(m => m.id === updated.id ? updated : m));
      setReplyMessage(updated.replyMessage || '');
      toast.success('Réponse envoyée par email');
    } catch {
      toast.error("Impossible d'envoyer la réponse");
    } finally {
      setSending(false);
    }
  };

  const unread = messages.filter(m => !m.isRead).length;
  const replied = messages.filter(m => m.repliedAt).length;
  const visibleMessages = messages.slice(0, visibleCount);
  const hasMore = visibleCount < messages.length;

  return (
    <div className="space-y-4 pt-4">
      {/* Stats */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold">Messages de contact</h2>
          <p className="text-sm text-muted-foreground">Gérez les demandes et répondez directement par email.</p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-700 px-4 py-2 rounded-xl text-sm font-medium">
            <Clock className="w-4 h-4" />{unread} non lu{unread !== 1 ? 's' : ''}
          </div>
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-xl text-sm font-medium">
            <CheckCheck className="w-4 h-4" />{replied} répondu{replied !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Two-panel inbox */}
      <div
        className="grid lg:grid-cols-[320px_1fr] gap-0 bg-white border border-border rounded-2xl overflow-hidden shadow-sm"
        style={{ height: 'calc(100vh - 300px)', minHeight: '480px' }}
      >
        {/* Left — inbox */}
        <div className="border-r border-border flex flex-col overflow-hidden">
          <div className="flex-shrink-0 px-4 py-4 border-b border-border bg-accent/30">
            <div className="flex items-center gap-2 font-semibold text-sm">
              <Inbox className="w-4 h-4" />
              Boîte de réception
              {unread > 0 && (
                <span className="ml-auto bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">{unread}</span>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {loading ? (
              <div className="p-6 text-center text-sm text-muted-foreground">Chargement...</div>
            ) : messages.length === 0 ? (
              <div className="p-8 text-center">
                <Mail className="w-10 h-10 mx-auto text-muted-foreground mb-3 opacity-40" />
                <p className="text-sm text-muted-foreground">Aucun message pour le moment.</p>
              </div>
            ) : (
              <>
                {visibleMessages.map(message => (
                  <button
                    key={message.id}
                    type="button"
                    onClick={() => setSelectedId(message.id)}
                    className={`w-full px-4 py-4 text-left transition-colors ${
                      selectedId === message.id ? 'bg-primary/5 border-l-2 border-l-primary' : 'hover:bg-accent/40 border-l-2 border-l-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className={`text-sm truncate ${!message.isRead ? 'font-semibold' : 'font-medium'}`}>{message.name}</span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                        {new Date(message.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                    <div className={`text-xs mb-1 truncate ${!message.isRead ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>{message.subject}</div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground line-clamp-1">{message.message}</span>
                      {message.repliedAt ? (
                        <span className="flex-shrink-0 inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                          <MailCheck className="w-3 h-3" /> Répondu
                        </span>
                      ) : !message.isRead ? (
                        <span className="flex-shrink-0 w-2 h-2 rounded-full bg-primary" />
                      ) : null}
                    </div>
                  </button>
                ))}
                {hasMore && (
                  <button
                    type="button"
                    onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
                    className="w-full px-4 py-3 flex items-center justify-center gap-2 text-sm text-primary font-medium hover:bg-accent/40 transition"
                  >
                    <ChevronDown className="w-4 h-4" />
                    Voir plus ({messages.length - visibleCount} restants)
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right — message detail */}
        <div className="flex flex-col overflow-hidden">
          {!selectedMessage ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground p-8">
              <MessageSquare className="w-12 h-12 opacity-30" />
              <p className="text-sm">Sélectionnez un message pour le lire</p>
            </div>
          ) : (
            <>
              <div className="flex-shrink-0 px-6 py-5 border-b border-border">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h3 className="text-base font-semibold leading-tight">{selectedMessage.subject}</h3>
                  {selectedMessage.repliedAt ? (
                    <span className="flex-shrink-0 inline-flex items-center gap-1.5 text-xs bg-green-100 text-green-700 border border-green-200 px-3 py-1 rounded-full font-medium">
                      <MailCheck className="w-3.5 h-3.5" /> Répondu
                    </span>
                  ) : (
                    <span className="flex-shrink-0 inline-flex items-center gap-1.5 text-xs bg-orange-50 text-orange-600 border border-orange-200 px-3 py-1 rounded-full font-medium">
                      <Clock className="w-3.5 h-3.5" /> En attente
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {selectedMessage.name}</span>
                  <span className="flex items-center gap-1.5"><AtSign className="w-3.5 h-3.5" /> {selectedMessage.email}</span>
                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{new Date(selectedMessage.createdAt).toLocaleString('fr-FR')}</span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 min-h-0">
                <div className="bg-accent/30 rounded-xl p-5">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{selectedMessage.message}</p>
                </div>
                {selectedMessage.repliedAt && selectedMessage.replyMessage && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                    <div className="flex items-center gap-2 text-xs font-medium text-green-700 mb-2">
                      <MailCheck className="w-3.5 h-3.5" />
                      Votre réponse — envoyée le {new Date(selectedMessage.repliedAt).toLocaleString('fr-FR')}
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-green-900">{selectedMessage.replyMessage}</p>
                  </div>
                )}
              </div>
              <div className="flex-shrink-0 border-t border-border px-6 py-4 bg-white">
                <label className="block text-sm font-medium mb-2">
                  {selectedMessage.repliedAt ? 'Envoyer une nouvelle réponse' : 'Répondre par email'}
                </label>
                <textarea
                  value={replyMessage}
                  onChange={e => setReplyMessage(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleReply(); }}
                  rows={3}
                  placeholder="Rédigez votre réponse..."
                  className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-muted-foreground">
                    {selectedMessage.repliedAt
                      ? `Dernière réponse : ${new Date(selectedMessage.repliedAt).toLocaleString('fr-FR')}`
                      : 'La réponse sera envoyée à ' + selectedMessage.email}
                  </span>
                  <button
                    onClick={handleReply}
                    disabled={sending || !replyMessage.trim()}
                    className="inline-flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition disabled:opacity-60"
                  >
                    <Send className="w-4 h-4" />
                    {sending ? 'Envoi...' : selectedMessage.repliedAt ? 'Renvoyer' : 'Envoyer'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SIGNALEMENTS
// ─────────────────────────────────────────────────────────────────────────────

type Reporter = { id: string; name: string; email: string; role: string };
type ReportedMessage = { id: string; content: string; senderId: string; sender: { id: string; name: string; email: string; role: string } | null } | null;
type ReportedComment = { id: string; content: string; authorId: string; lessonId: string; author: { id: string; name: string; email: string; role: string } | null } | null;
type Report = { id: string; reason: string; status: 'PENDING' | 'REVIEWED'; reporterId: string; messageId: string | null; commentId: string | null; reporter: Reporter; message: ReportedMessage; comment: ReportedComment; createdAt: string };

function ReportsSection() {
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
      setReports(prev => prev.map(r => r.id === report.id ? updated : r));
      toast.success('Signalement marqué comme traité.');
    } catch {
      toast.error('Erreur lors de la mise à jour.');
    } finally {
      setMarkingId(null);
    }
  };

  const filtered = reports.filter(r => filterStatus === 'ALL' || r.status === filterStatus);
  const pendingCount = reports.filter(r => r.status === 'PENDING').length;

  return (
    <div className="space-y-4 pt-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-lg font-semibold">Signalements</h2>
          <p className="text-sm text-muted-foreground">Gérez les contenus signalés par les utilisateurs</p>
        </div>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-medium">
              <Clock className="w-4 h-4" />{pendingCount} en attente
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

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
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
              {filterStatus === 'ALL' ? "Aucun signalement pour l'instant." : `Aucun signalement ${filterStatus === 'PENDING' ? 'en attente' : 'traité'}.`}
            </p>
          </div>
        ) : filtered.map(report => (
          <div
            key={report.id}
            className={`bg-white border rounded-xl p-5 shadow-sm transition-colors ${
              report.status === 'PENDING' ? 'border-red-200 border-l-4 border-l-red-400' : 'border-border border-l-4 border-l-emerald-400'
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm">{report.reporter.name}</span>
                  <span className="text-xs text-muted-foreground">{report.reporter.email}</span>
                  <Badge className={`text-xs ${report.reporter.role === 'STUDENT' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-teal-50 text-teal-700 border-teal-200'}`}>
                    {report.reporter.role === 'STUDENT' ? 'Étudiant' : 'Formateur'}
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {new Date(report.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  {report.messageId && <span className="ml-2 inline-flex items-center gap-1 text-violet-600"><MessageSquare className="w-3 h-3" /> Message</span>}
                  {report.commentId && <span className="ml-2 inline-flex items-center gap-1 text-indigo-600"><MessageCircle className="w-3 h-3" /> Commentaire</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {report.status === 'PENDING' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border bg-amber-50 text-amber-700 border-amber-200">
                    <Clock className="w-3 h-3" />En attente
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border bg-emerald-50 text-emerald-700 border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" />Traité
                  </span>
                )}
                {report.status === 'PENDING' && (
                  <button
                    onClick={() => handleMarkReviewed(report)}
                    disabled={markingId === report.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition disabled:opacity-60"
                  >
                    {markingId === report.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />}
                    Marquer comme traité
                  </button>
                )}
              </div>
            </div>
            <div className="mt-3 bg-red-50 border border-red-100 rounded-lg px-4 py-2.5">
              <p className="text-xs font-medium text-red-700 mb-0.5">Raison du signalement</p>
              <p className="text-sm text-red-900">{report.reason}</p>
            </div>
            {(report.message || report.comment) && (
              <div className="mt-2 bg-accent/40 border border-border rounded-lg px-4 py-2.5 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs font-medium text-muted-foreground">Contenu signalé</p>
                  {(report.message?.sender || report.comment?.author) && (() => {
                    const person = report.message?.sender ?? report.comment?.author;
                    return (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 bg-slate-100 border border-slate-200 rounded-full px-2 py-0.5">
                        <span className="w-4 h-4 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[9px] font-bold shrink-0">
                          {person!.name.charAt(0).toUpperCase()}
                        </span>
                        {person!.name}
                        <span className="text-muted-foreground">·</span>
                        <span className="text-muted-foreground">{person!.email}</span>
                        <Badge className={`text-[10px] ml-0.5 ${person!.role === 'STUDENT' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-teal-50 text-teal-700 border-teal-200'}`}>
                          {person!.role === 'STUDENT' ? 'Étudiant' : 'Formateur'}
                        </Badge>
                      </span>
                    );
                  })()}
                </div>
                <p className="text-sm text-foreground line-clamp-3">{report.message?.content ?? report.comment?.content ?? '—'}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAIEMENTS
// ─────────────────────────────────────────────────────────────────────────────

const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

function buildRevenueChart(payments: any[]) {
  const now = new Date();
  const slots = Array.from({ length: 9 }, (_, i) => {
    const d = new Date(now.getFullYear(), 2 + i, 1);
    return { month: MONTHS_FR[d.getMonth()], year: d.getFullYear(), monthIndex: d.getMonth(), revenue: 0 };
  });
  payments.forEach(p => {
    if (p.status !== 'COMPLETED' || !p.createdAt) return;
    const d = new Date(p.createdAt);
    const slot = slots.find(s => s.monthIndex === d.getMonth() && s.year === d.getFullYear());
    if (slot) slot.revenue += p.amount ?? 0;
  });
  return slots.map(s => ({ month: s.month, revenue: s.revenue }));
}

function PaymentsSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    paymentsApi.getAll()
      .then(data => setPayments(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = payments.filter(p =>
    (p.user?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.course?.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const now = new Date();
  const totalRevenue = payments.filter(p => p.status === 'COMPLETED').reduce((s, p) => s + (p.amount || 0), 0);
  const thisMonth = payments
    .filter(p => p.status === 'COMPLETED' && new Date(p.createdAt).getMonth() === now.getMonth() && new Date(p.createdAt).getFullYear() === now.getFullYear())
    .reduce((s, p) => s + (p.amount || 0), 0);
  const revenueChartData = buildRevenueChart(payments);

  return (
    <div className="space-y-6 pt-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Gestion des paiements</h2>
          <p className="text-sm text-muted-foreground">Suivi des revenus et transactions</p>
        </div>
        <button className="px-4 py-2 border border-border rounded-lg hover:bg-accent transition flex items-center gap-2 text-sm font-medium">
          <Download className="w-4 h-4" />Exporter CSV
        </button>
      </div>

      {/* Chart + Stats */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-teal-100 border-l-4 border-l-teal-400 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-teal-600" />
            <h3 className="text-base font-semibold">Revenus mensuels (DT)</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueChartData} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={v => `${v}DT`} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => [`${v}DT`, 'Revenus']} contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }} />
              <Bar dataKey="revenue" fill="#0d9488" opacity={0.85} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex-1 bg-white border border-indigo-100 border-l-4 border-l-indigo-400 rounded-xl p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg bg-indigo-50"><Euro className="w-5 h-5 text-indigo-600" /></div>
              <span className="text-sm text-muted-foreground">Revenus totaux</span>
            </div>
            <div className="text-3xl font-bold text-indigo-700">{totalRevenue.toFixed(0)}DT</div>
            <div className="text-xs text-muted-foreground mt-1">Tous paiements complétés</div>
          </div>
          <div className="flex-1 bg-white border border-teal-100 border-l-4 border-l-teal-400 rounded-xl p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg bg-teal-50"><TrendingUp className="w-5 h-5 text-teal-600" /></div>
              <span className="text-sm text-muted-foreground">Ce mois-ci</span>
            </div>
            <div className="text-3xl font-bold text-teal-700">{thisMonth.toFixed(0)}DT</div>
            <div className="text-xs text-muted-foreground mt-1">{MONTHS_FR[now.getMonth()]} {now.getFullYear()}</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white border border-border rounded-xl p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Rechercher par étudiant ou cours..."
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-border">
          <span className="font-semibold text-sm">Transactions ({filtered.length})</span>
        </div>
        <table className="w-full">
          <thead className="bg-accent/40">
            <tr>
              {['Étudiant', 'Cours', 'Montant', 'Date', 'Statut'].map(h => (
                <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-10 text-center text-muted-foreground text-sm">Chargement...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-10 text-center text-muted-foreground text-sm">Aucun paiement trouvé.</td></tr>
            ) : filtered.map(payment => (
              <tr key={payment.id} className="hover:bg-accent/20 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-medium text-sm">{payment.user?.name}</div>
                  <div className="text-xs text-muted-foreground">{payment.user?.email}</div>
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{payment.course?.title}</td>
                <td className="px-6 py-4"><span className="font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md text-sm">{payment.amount}DT</span></td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{new Date(payment.createdAt).toLocaleDateString('fr-FR')}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${payment.status === 'COMPLETED' ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                    {payment.status === 'COMPLETED' ? 'Complété' : 'En attente'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PARAMÈTRES
// ─────────────────────────────────────────────────────────────────────────────

function SettingsSection() {
  const [settings, setSettings] = useState({
    siteName: 'Iz Academy',
    siteEmail: 'nourslama60@gmail.com',
    supportEmail: 'support@izacademy.com',
    currency: 'DT',
    language: 'fr',
    timezone: 'Europe/Paris',
    emailNotifications: true,
    maintenanceMode: false,
  });

  const handleSave = () => { toast.success('Paramètres sauvegardés avec succès !'); };

  return (
    <div className="space-y-6 pt-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Paramètres de la plateforme</h2>
          <p className="text-sm text-muted-foreground">Configurez les informations et préférences du site</p>
        </div>
        <button
          onClick={handleSave}
          className="px-5 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition flex items-center gap-2 text-sm"
        >
          <Save className="w-4 h-4" />Sauvegarder
        </button>
      </div>

      <div className="bg-white border border-indigo-100 border-l-4 border-l-indigo-300 rounded-xl p-6 space-y-6 shadow-sm">
        {/* Informations générales */}
        <div>
          <h3 className="font-semibold mb-4">Informations générales</h3>
          <div className="space-y-4">
            {[
              { id: 'siteName', label: 'Nom du site', type: 'text', key: 'siteName' as const },
              { id: 'siteEmail', label: 'Email du site', type: 'email', key: 'siteEmail' as const },
              { id: 'supportEmail', label: 'Email de support', type: 'email', key: 'supportEmail' as const },
            ].map(field => (
              <div key={field.id}>
                <label htmlFor={field.id} className="block mb-2 text-sm font-medium">{field.label}</label>
                <input
                  id={field.id}
                  type={field.type}
                  value={settings[field.key]}
                  onChange={e => setSettings({ ...settings, [field.key]: e.target.value })}
                  className="w-full px-4 py-3 border border-border rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Préférences */}
        <div className="pt-6 border-t border-border">
          <h3 className="font-semibold mb-4">Préférences</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="currency" className="block mb-2 text-sm font-medium">Devise</label>
              <select id="currency" value={settings.currency} onChange={e => setSettings({ ...settings, currency: e.target.value })}
                className="w-full px-4 py-3 border border-border rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-primary text-sm">
                <option value="DT">Dinar tunisien (DT)</option>
                <option value="EUR">Euro (€)</option>
                <option value="USD">Dollar ($)</option>
              </select>
            </div>
            <div>
              <label htmlFor="language" className="block mb-2 text-sm font-medium">Langue</label>
              <select id="language" value={settings.language} onChange={e => setSettings({ ...settings, language: e.target.value })}
                className="w-full px-4 py-3 border border-border rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-primary text-sm">
                <option value="fr">Français</option>
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
            </div>
            <div>
              <label htmlFor="timezone" className="block mb-2 text-sm font-medium">Fuseau horaire</label>
              <select id="timezone" value={settings.timezone} onChange={e => setSettings({ ...settings, timezone: e.target.value })}
                className="w-full px-4 py-3 border border-border rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-primary text-sm">
                <option value="Europe/Paris">Paris (GMT+1)</option>
                <option value="America/New_York">New York (GMT-5)</option>
                <option value="Asia/Tokyo">Tokyo (GMT+9)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="pt-6 border-t border-border">
          <h3 className="font-semibold mb-4">Options</h3>
          <div className="space-y-4">
            {[
              { key: 'emailNotifications' as const, label: 'Notifications par email', desc: 'Envoyer des notifications aux utilisateurs' },
              { key: 'maintenanceMode' as const, label: 'Mode maintenance', desc: 'Désactiver temporairement le site' },
            ].map(opt => (
              <label key={opt.key} className="flex items-center justify-between p-4 bg-accent/50 rounded-lg cursor-pointer">
                <div>
                  <div className="font-medium text-sm mb-0.5">{opt.label}</div>
                  <div className="text-sm text-muted-foreground">{opt.desc}</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings[opt.key]}
                  onChange={e => setSettings({ ...settings, [opt.key]: e.target.checked })}
                  className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                />
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

const TABS = [
  { value: 'categories',  label: 'Catégories',          icon: FolderTree },
  { value: 'contact',     label: 'Messages de contact',  icon: Mail       },
  { value: 'reports',     label: 'Signalements',         icon: Flag       },
  { value: 'payments',    label: 'Paiements',            icon: CreditCard },
  { value: 'settings',    label: 'Paramètres',           icon: Settings   },
];

export function AdminConfiguration() {
  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Page header */}
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Settings className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Configuration</h1>
            <p className="text-sm text-muted-foreground">Gérez les catégories, messages, signalements, paiements et paramètres</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="categories" className="w-full">
          <TabsList className="w-full flex h-auto p-1 gap-1 bg-accent/60 rounded-xl flex-wrap">
            {TABS.map(tab => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary"
              >
                <tab.icon className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="categories"><CategoriesSection /></TabsContent>
          <TabsContent value="contact"><ContactSection /></TabsContent>
          <TabsContent value="reports"><ReportsSection /></TabsContent>
          <TabsContent value="payments"><PaymentsSection /></TabsContent>
          <TabsContent value="settings"><SettingsSection /></TabsContent>
        </Tabs>

      </div>
    </AdminLayout>
  );
}
