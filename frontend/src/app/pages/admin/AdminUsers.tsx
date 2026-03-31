import { AdminLayout } from '../../components/AdminLayout';
import {
  Search, Trash2, Eye, UserPlus, Edit, Copy, CheckCheck,
  ChevronRight, BookOpen, FolderGit2, Award, CheckCircle2, Clock, XCircle,
  ShieldCheck, Loader2, ExternalLink, AlertCircle, Trophy, HelpCircle,
  Users, GraduationCap, Briefcase, ShieldAlert,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '../../components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { toast } from 'sonner';
import { usersApi } from '../../../api/users.api';
import { coursesApi } from '../../../api/courses.api';
import { projectsApi } from '../../../api/projects.api';

// ─── Types ────────────────────────────────────────────────────────────────────

type ApiUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  formation?: string;
  duree?: string;
  dateDebut?: string;
  createdAt?: string;
};

type CourseProgress = {
  courseId: string;
  courseTitle: string;
  thumbnailUrl: string | null;
  total: number;
  completed: number;
  percentage: number;
};

type Submission = {
  id: string;
  githubUrl: string;
  comment?: string;
  status: 'PENDING' | 'VALIDATED' | 'NEEDS_IMPROVEMENT';
  feedback?: string;
  adminApproved: boolean;
  adminApprovedAt?: string;
  submittedAt: string;
  project: { id: string; title: string; courseId: string };
};

type Certificate = {
  id: string;
  courseId: string;
  fileUrl: string | null;
  issuedAt: string;
  course: { id: string; title: string; thumbnailUrl: string | null; teacher: { name: string } };
};

type StudentOverview = {
  user: ApiUser;
  progressByCourse: CourseProgress[];
  submissions: Submission[];
  certificates: Certificate[];
};

// ─── Constants ────────────────────────────────────────────────────────────────

const SUBMISSION_STATUS = {
  PENDING:           { label: 'En attente',   color: 'bg-amber-50 text-amber-700 border-amber-200',   icon: Clock        },
  VALIDATED:         { label: 'Validé',        color: 'bg-teal-50 text-teal-700 border-teal-200',     icon: CheckCircle2 },
  NEEDS_IMPROVEMENT: { label: 'À améliorer',   color: 'bg-red-50 text-red-700 border-red-200',        icon: XCircle      },
} as const;

type CertStatus = 'NOT_ELIGIBLE' | 'WAITING_TEACHER' | 'REJECTED' | 'WAITING_ADMIN' | 'APPROVED' | 'GENERATED';

function getCertStatus(
  cp: CourseProgress,
  submissions: Submission[],
  certificates: Certificate[],
): CertStatus {
  const cert = certificates.find(c => c.courseId === cp.courseId);
  if (cert?.fileUrl) return 'GENERATED';
  if (cert) return 'APPROVED'; // cert record exists but no URL yet → generating
  const sub = submissions.find(s => s.project.courseId === cp.courseId);
  if (!sub || cp.percentage < 100) return 'NOT_ELIGIBLE';
  if (sub.adminApproved) return 'APPROVED';
  if (sub.status === 'VALIDATED') return 'WAITING_ADMIN';
  if (sub.status === 'NEEDS_IMPROVEMENT') return 'REJECTED';
  return 'WAITING_TEACHER';
}

const CERT_STATUS_CONFIG: Record<CertStatus, { label: string; color: string; Icon: React.ElementType; spin?: boolean }> = {
  NOT_ELIGIBLE:   { label: 'Non éligible',      color: 'bg-gray-50 text-gray-500 border-gray-200',         Icon: HelpCircle   },
  WAITING_TEACHER:{ label: 'Attente formateur',  color: 'bg-amber-50 text-amber-700 border-amber-200',      Icon: Clock        },
  REJECTED:       { label: 'À améliorer',        color: 'bg-red-50 text-red-700 border-red-200',            Icon: XCircle      },
  WAITING_ADMIN:  { label: 'Attente admin',       color: 'bg-violet-50 text-violet-700 border-violet-200',  Icon: ShieldCheck  },
  APPROVED:       { label: 'En génération…',      color: 'bg-teal-50 text-teal-700 border-teal-200',        Icon: Loader2, spin: true },
  GENERATED:      { label: 'Certificat émis',     color: 'bg-green-50 text-green-700 border-green-200',     Icon: Trophy       },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function OverviewSkeleton() {
  return (
    <div className="px-6 py-5 space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-4 w-44" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white border border-border rounded-xl p-4 space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-2 w-full rounded-full" />
              <div className="flex justify-between">
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        {[1, 2].map(i => (
          <div key={i} className="bg-white border border-border rounded-xl p-4 space-y-2">
            <div className="flex justify-between items-start">
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-7 w-28 rounded-full ml-4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProgressCard({
  cp, submissions, certificates,
}: {
  cp: CourseProgress;
  submissions: Submission[];
  certificates: Certificate[];
}) {
  const certStatus = getCertStatus(cp, submissions, certificates);
  const { label, color, Icon, spin } = CERT_STATUS_CONFIG[certStatus];

  return (
    <div className="bg-white border border-indigo-100 rounded-xl p-4 shadow-sm space-y-3">
      <div className="font-medium text-sm truncate" title={cp.courseTitle}>{cp.courseTitle}</div>
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-indigo-100 rounded-full h-2">
          <div
            className="bg-indigo-500 h-2 rounded-full transition-all"
            style={{ width: `${cp.percentage}%` }}
          />
        </div>
        <span className="text-xs font-semibold text-indigo-700 w-10 text-right">{cp.percentage}%</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {cp.completed} / {cp.total} leçons
        </span>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${color}`}>
          <Icon className={`w-3 h-3 ${spin ? 'animate-spin' : ''}`} />
          {label}
        </span>
      </div>
    </div>
  );
}

function SubmissionCard({
  sub, onApprove, approvingId,
}: {
  sub: Submission;
  onApprove: (sub: Submission) => void;
  approvingId: string | null;
}) {
  const cfg = SUBMISSION_STATUS[sub.status] ?? SUBMISSION_STATUS.PENDING;
  const StatusIcon = cfg.icon;
  const canApprove = sub.status === 'VALIDATED' && !sub.adminApproved;

  return (
    <div className="bg-white border border-violet-100 rounded-xl p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-medium text-sm">{sub.project.title}</div>
          <a
            href={sub.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline mt-1"
          >
            <ExternalLink className="w-3 h-3" />
            {sub.githubUrl}
          </a>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.color}`}>
            <StatusIcon className="w-3 h-3" />
            {cfg.label}
          </span>
          {sub.adminApproved ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border bg-teal-50 text-teal-700 border-teal-200">
              <ShieldCheck className="w-3 h-3" />
              Certificat autorisé
            </span>
          ) : canApprove ? (
            <button
              onClick={() => onApprove(sub)}
              disabled={approvingId === sub.id}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 text-white text-xs font-medium rounded-lg hover:bg-teal-700 transition disabled:opacity-60"
            >
              {approvingId === sub.id
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <ShieldCheck className="w-3 h-3" />
              }
              Autoriser le certificat
            </button>
          ) : null}
        </div>
      </div>

      {sub.feedback && (
        <div className="mt-2 text-xs text-muted-foreground bg-accent/40 rounded-lg px-3 py-2">
          <span className="font-medium">Retour formateur :</span> {sub.feedback}
        </div>
      )}
      <div className="mt-2 text-xs text-muted-foreground">
        Soumis le {new Date(sub.submittedAt).toLocaleDateString('fr-FR')}
        {sub.adminApprovedAt && (
          <> · Approuvé le {new Date(sub.adminApprovedAt).toLocaleDateString('fr-FR')}</>
        )}
      </div>
    </div>
  );
}

function CertificateCard({
  cert, submissions, onRevoke, revoking,
}: {
  cert: Certificate;
  submissions: Submission[];
  onRevoke: (cert: Certificate) => void;
  revoking: boolean;
}) {
  // Check validity: must have a VALIDATED + adminApproved submission for this course
  const validSub = submissions.find(
    s => s.project.courseId === cert.courseId && s.status === 'VALIDATED' && s.adminApproved,
  );
  const invalidSub = submissions.find(
    s => s.project.courseId === cert.courseId && (s.status === 'NEEDS_IMPROVEMENT' || s.status === 'PENDING'),
  );
  const noSub = !submissions.find(s => s.project.courseId === cert.courseId);
  const isInvalid = !validSub && (invalidSub || noSub);

  return (
    <div className={`border rounded-xl p-4 shadow-sm space-y-2 ${isInvalid ? 'bg-red-50 border-red-200' : 'bg-white border-amber-100'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-medium text-sm truncate" title={cert.course.title}>{cert.course.title}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Formateur : {cert.course.teacher.name}</div>
          <div className="text-xs text-muted-foreground">Émis le {new Date(cert.issuedAt).toLocaleDateString('fr-FR')}</div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {cert.fileUrl && (
            <a href={cert.fileUrl} target="_blank" rel="noopener noreferrer"
              className="p-2 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition" title="Télécharger">
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
          {!cert.fileUrl && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground bg-accent/50 rounded-lg">
              <Loader2 className="w-3 h-3 animate-spin" />
              Génération…
            </span>
          )}
          <button
            onClick={() => onRevoke(cert)}
            disabled={revoking}
            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition disabled:opacity-50"
            title="Révoquer le certificat"
          >
            {revoking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
      {isInvalid && (
        <div className="flex items-center gap-2 text-xs text-red-700 bg-red-100 border border-red-200 rounded-lg px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {noSub
            ? 'Certificat invalide : aucun projet soumis pour ce cours.'
            : `Certificat invalide : projet "${invalidSub?.project?.title}" non validé (${invalidSub?.status === 'NEEDS_IMPROVEMENT' ? 'à améliorer' : 'en attente'}).`}
        </div>
      )}
    </div>
  );
}

function ConfirmApproveModal({
  submission, onConfirm, onCancel,
}: {
  submission: Submission | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <AlertDialog open={submission !== null}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Autoriser le certificat</AlertDialogTitle>
          <AlertDialogDescription>
            Confirmez-vous l&apos;autorisation du certificat pour le projet{' '}
            <strong>{submission?.project.title}</strong> ?{' '}
            Cette action déclenchera la génération du certificat pour l&apos;étudiant.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            <ShieldCheck className="w-4 h-4 mr-1.5" />
            Autoriser
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AdminUsers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [editUser, setEditUser] = useState<ApiUser | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', formation: '', duree: '', dateDebut: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [teacherForm, setTeacherForm] = useState({ name: '', email: '' });
  const [teacherCourseIds, setTeacherCourseIds] = useState<string[]>([]);
  const [availableCourses, setAvailableCourses] = useState<{ id: string; title: string }[]>([]);
  const [generatedPassword, setGeneratedPassword] = useState<{ name: string; email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const [users, setUsers] = useState<ApiUser[]>([]);

  // Student overview panel
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
  const [overview, setOverview] = useState<StudentOverview | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overviewError, setOverviewError] = useState('');
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // Confirmation modal
  const [pendingApproval, setPendingApproval] = useState<Submission | null>(null);

  // Certificate revocation
  const [revokingCertId, setRevokingCertId] = useState<string | null>(null);
  const [pendingRevoke, setPendingRevoke] = useState<Certificate | null>(null);

  useEffect(() => {
    Promise.all([usersApi.getAll(), coursesApi.getAdmin()])
      .then(([userData, courseData]) => {
        setUsers(userData as ApiUser[]);
        setAvailableCourses((courseData as any[]).map((c: any) => ({ id: c.id, title: c.title })));
      })
      .catch(() => setError('Impossible de charger les utilisateurs.'))
      .finally(() => setLoading(false));
  }, []);

  const loadOverview = useCallback(async (userId: string) => {
    if (expandedStudentId === userId) {
      setExpandedStudentId(null);
      setOverview(null);
      return;
    }
    setExpandedStudentId(userId);
    setOverview(null);
    setOverviewError('');
    setOverviewLoading(true);
    try {
      const data = await usersApi.getStudentOverview(userId) as StudentOverview;
      setOverview(data);
    } catch {
      setOverviewError('Impossible de charger les données de cet étudiant.');
    } finally {
      setOverviewLoading(false);
    }
  }, [expandedStudentId]);

  const confirmApprove = async () => {
    if (!pendingApproval) return;
    const sub = pendingApproval;
    setPendingApproval(null);
    setApprovingId(sub.id);
    try {
      await projectsApi.adminApprove(sub.id);
      toast.success('Certificat autorisé', {
        description: `La génération du certificat pour "${sub.project.title}" a été déclenchée.`,
      });
      if (expandedStudentId) {
        const data = await usersApi.getStudentOverview(expandedStudentId) as StudentOverview;
        setOverview(data);
      }
    } catch (err: any) {
      toast.error('Erreur', {
        description: err?.message || "Impossible d'autoriser le certificat.",
      });
    } finally {
      setApprovingId(null);
    }
  };

  const confirmRevoke = async () => {
    if (!pendingRevoke || !expandedStudentId) return;
    const cert = pendingRevoke;
    setPendingRevoke(null);
    setRevokingCertId(cert.id);
    try {
      await usersApi.revokeCertificate(expandedStudentId, cert.courseId);
      toast.success('Certificat révoqué');
      const data = await usersApi.getStudentOverview(expandedStudentId) as StudentOverview;
      setOverview(data);
    } catch {
      toast.error('Erreur lors de la révocation du certificat');
    } finally {
      setRevokingCertId(null);
    }
  };

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await usersApi.createUser({ name: teacherForm.name, email: teacherForm.email, role: 'teacher' });
      const { generatedPassword: pwd, ...created } = res;
      if (teacherCourseIds.length > 0) {
        await usersApi.assignCourses(created.id, teacherCourseIds);
      }
      setUsers(prev => [...prev, created as ApiUser]);
      setTeacherForm({ name: '', email: '' });
      setTeacherCourseIds([]);
      setShowAddTeacher(false);
      setGeneratedPassword({ name: created.name, email: created.email, password: pwd });
    } catch {
      toast.error('Erreur lors de la création du formateur.');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('Confirmer la suppression de cet utilisateur ?')) return;
    try {
      await usersApi.deleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
      if (expandedStudentId === id) { setExpandedStudentId(null); setOverview(null); }
      toast.success('Utilisateur supprimé.');
    } catch {
      toast.error('Erreur lors de la suppression.');
    }
  };

  const openEditModal = (u: ApiUser) => {
    setEditUser(u);
    setEditForm({ name: u.name, email: u.email, formation: u.formation || '', duree: u.duree || '', dateDebut: u.dateDebut || '' });
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    try {
      const updated: ApiUser = await usersApi.updateUser(editUser.id, {
        name: editForm.name,
        email: editForm.email,
        formation: editForm.formation,
        duree: editForm.duree,
        dateDebut: editForm.dateDebut,
      });
      setUsers(prev => prev.map(u => u.id === editUser.id ? { ...u, ...updated } : u));
      setEditUser(null);
      toast.success('Utilisateur modifié avec succès.');
    } catch {
      toast.error('Erreur lors de la modification.');
    }
  };

  const filteredUsers = users.filter(u => {
    const role = u.role.toLowerCase();
    const matchRole = filterRole === 'all' || role === filterRole;
    const matchSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchRole && matchSearch;
  });

  const selectedUserObj = selectedUser ? users.find(u => u.id === selectedUser) : null;

  const studentCount = users.filter(u => u.role.toLowerCase() === 'student').length;
  const teacherCount = users.filter(u => u.role.toLowerCase() === 'teacher').length;
  const adminCount   = users.filter(u => u.role.toLowerCase() === 'admin').length;

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-100 rounded-xl">
                <Users className="w-6 h-6 text-slate-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-700">Gestion des utilisateurs</h1>
                <p className="text-slate-400 text-sm mt-0.5">Gérez les comptes, progressions et certificats</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddTeacher(true)}
              className="px-4 py-2.5 bg-indigo-50 text-indigo-600 font-semibold rounded-xl border border-indigo-100 hover:bg-indigo-100 transition flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Ajouter formateur
            </button>
          </div>

          {/* Stat chips */}
          <div className="flex flex-wrap gap-3 mt-5">
            <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2">
              <GraduationCap className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-medium text-indigo-600">{studentCount}</span>
              <span className="text-xs text-indigo-400">Étudiants</span>
            </div>
            <div className="flex items-center gap-2 bg-teal-50 border border-teal-100 rounded-xl px-4 py-2">
              <Briefcase className="w-4 h-4 text-teal-400" />
              <span className="text-sm font-medium text-teal-600">{teacherCount}</span>
              <span className="text-xs text-teal-400">Formateurs</span>
            </div>
            <div className="flex items-center gap-2 bg-violet-50 border border-violet-100 rounded-xl px-4 py-2">
              <ShieldAlert className="w-4 h-4 text-violet-400" />
              <span className="text-sm font-medium text-violet-600">{adminCount}</span>
              <span className="text-xs text-violet-400">Admins</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2">
              <Users className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-600">{users.length}</span>
              <span className="text-xs text-slate-400">Total</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* ── Search / Filter ────────────────────────────────────────────────── */}
        <div className="bg-white border border-indigo-100 rounded-xl p-4 shadow-sm">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Rechercher un utilisateur..."
                className="w-full pl-10 pr-4 py-2 border border-indigo-200 rounded-lg bg-indigo-50/30 focus:outline-none focus:ring-2 focus:ring-indigo-400 placeholder:text-indigo-300"
              />
            </div>
            <select
              value={filterRole}
              onChange={e => setFilterRole(e.target.value)}
              className="px-4 py-2 border border-indigo-200 rounded-lg bg-indigo-50/30 text-indigo-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="all">Tous les utilisateurs</option>
              <option value="student">Étudiants</option>
              <option value="teacher">Formateurs</option>
              <option value="admin">Administrateurs</option>
            </select>
          </div>
        </div>

        {/* ── Users Table ────────────────────────────────────────────────────── */}
        <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">
          <table className="w-full">
            <thead className="bg-white border-b border-border">
              <tr>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Utilisateur</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Rôle</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Email</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date d&apos;inscription</th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8">
                    <div className="space-y-4">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="flex items-center gap-4">
                          <div className="flex-1 space-y-1.5">
                            <Skeleton className="h-4 w-1/3" />
                            <Skeleton className="h-3 w-1/4" />
                          </div>
                          <Skeleton className="h-6 w-20 rounded-full" />
                          <Skeleton className="h-4 w-28" />
                          <Skeleton className="h-4 w-24" />
                          <div className="flex gap-2">
                            <Skeleton className="h-8 w-8 rounded-lg" />
                            <Skeleton className="h-8 w-8 rounded-lg" />
                            <Skeleton className="h-8 w-8 rounded-lg" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    Aucun utilisateur trouvé.
                  </td>
                </tr>
              ) : filteredUsers.map(u => {
                const roleKey = u.role.toLowerCase();
                const isExpanded = expandedStudentId === u.id;
                const avatarColor =
                  roleKey === 'student' ? 'bg-indigo-500' :
                  roleKey === 'teacher' ? 'bg-teal-500' : 'bg-violet-500';
                const rowAccent =
                  roleKey === 'student' ? 'border-l-4 border-l-indigo-400' :
                  roleKey === 'teacher' ? 'border-l-4 border-l-teal-400' : 'border-l-4 border-l-violet-400';
                return (
                  <>
                    <tr key={u.id} className={`hover:bg-accent/20 transition-colors ${rowAccent} ${isExpanded ? 'bg-indigo-50/40' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full ${avatarColor} text-white flex items-center justify-center text-xs font-bold shrink-0`}>
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="font-medium">{u.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                          roleKey === 'student' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                          roleKey === 'teacher' ? 'bg-teal-50 text-teal-700 border-teal-200' :
                          'bg-violet-50 text-violet-700 border-violet-200'
                        }`}>
                          {roleKey === 'student' ? 'Étudiant' : roleKey === 'teacher' ? 'Formateur' : 'Admin'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-muted-foreground">{u.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-muted-foreground">{u.createdAt ? new Date(u.createdAt).toLocaleDateString('fr-FR') : '—'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {roleKey === 'student' && (
                            <button
                              title="Voir la progression"
                              onClick={() => loadOverview(u.id)}
                              className={`p-2 rounded-lg transition ${isExpanded ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-accent'}`}
                            >
                              <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                            </button>
                          )}
                          <button className="p-2 hover:bg-blue-50 text-blue-500 rounded-lg transition" onClick={() => setSelectedUser(u.id)} title="Voir les détails">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-2 hover:bg-amber-50 text-amber-500 rounded-lg transition" onClick={() => openEditModal(u)} title="Modifier">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition" onClick={() => handleDeleteUser(u.id)} title="Supprimer">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* ── Student Overview Panel ────────────────────────────── */}
                    {isExpanded && (
                      <tr key={`${u.id}-overview`}>
                        <td colSpan={5} className="bg-indigo-50/60 px-0 py-0 border-b border-indigo-100">
                          {overviewLoading ? (
                            <OverviewSkeleton />
                          ) : overviewError ? (
                            <div className="px-6 py-5">
                              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                {overviewError}
                              </div>
                            </div>
                          ) : overview && overview.user.id === u.id ? (
                            <div className="px-6 py-5 space-y-6">

                              {/* 1. Progression par cours */}
                              <section>
                                <h3 className="flex items-center gap-2 text-sm font-semibold text-indigo-700 mb-3">
                                  <BookOpen className="w-4 h-4" />
                                  Progression des cours
                                </h3>
                                {overview.progressByCourse.length === 0 ? (
                                  <p className="text-sm text-muted-foreground">Aucune inscription approuvée.</p>
                                ) : (
                                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                    {overview.progressByCourse.map(cp => (
                                      <ProgressCard
                                        key={cp.courseId}
                                        cp={cp}
                                        submissions={overview.submissions}
                                        certificates={overview.certificates}
                                      />
                                    ))}
                                  </div>
                                )}
                              </section>

                              {/* 2. Projets soumis */}
                              <section>
                                <h3 className="flex items-center gap-2 text-sm font-semibold text-violet-700 mb-3">
                                  <FolderGit2 className="w-4 h-4" />
                                  Projets soumis
                                </h3>
                                {overview.submissions.length === 0 ? (
                                  <p className="text-sm text-muted-foreground">Aucun projet soumis.</p>
                                ) : (
                                  <div className="space-y-3">
                                    {overview.submissions.map(sub => (
                                      <SubmissionCard
                                        key={sub.id}
                                        sub={sub}
                                        onApprove={setPendingApproval}
                                        approvingId={approvingId}
                                      />
                                    ))}
                                  </div>
                                )}
                              </section>

                              {/* 3. Certificats */}
                              <section>
                                <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-700 mb-3">
                                  <Award className="w-4 h-4" />
                                  Certificats obtenus
                                </h3>
                                {overview.certificates.length === 0 ? (
                                  <p className="text-sm text-muted-foreground">Aucun certificat pour l&apos;instant.</p>
                                ) : (
                                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                    {overview.certificates.map(cert => (
                                      <CertificateCard
                                        key={cert.id}
                                        cert={cert}
                                        submissions={overview.submissions}
                                        onRevoke={setPendingRevoke}
                                        revoking={revokingCertId === cert.id}
                                      />
                                    ))}
                                  </div>
                                )}
                              </section>

                            </div>
                          ) : null}
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Confirm Approve Modal ─────────────────────────────────────────── */}
        <ConfirmApproveModal
          submission={pendingApproval}
          onConfirm={confirmApprove}
          onCancel={() => setPendingApproval(null)}
        />

        {/* ── Confirm Revoke Certificate Modal ──────────────────────────────── */}
        <AlertDialog open={pendingRevoke !== null}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Révoquer le certificat</AlertDialogTitle>
              <AlertDialogDescription>
                Voulez-vous vraiment révoquer le certificat pour le cours{' '}
                <strong>{pendingRevoke?.course.title}</strong> ? Cette action est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setPendingRevoke(null)}>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={confirmRevoke} className="bg-red-600 hover:bg-red-700 text-white">
                <Trash2 className="w-4 h-4 mr-1.5" />
                Révoquer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* ── Generated Password Modal ──────────────────────────────────────── */}
        <Dialog open={generatedPassword !== null} onOpenChange={() => { setGeneratedPassword(null); setCopied(false); }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Formateur créé avec succès !</DialogTitle>
              <DialogDescription>
                Communiquez ces identifiants à <strong>{generatedPassword?.name}</strong>. Le mot de passe ne sera plus affiché.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <label className="block text-sm font-medium mb-1 text-muted-foreground">Email</label>
                <div className="px-3 py-2 border border-border rounded-lg bg-accent/30 text-sm font-mono">{generatedPassword?.email}</div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-muted-foreground">Mot de passe généré</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2 border border-border rounded-lg bg-accent/30 text-sm font-mono tracking-wider">
                    {generatedPassword?.password}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedPassword?.password || '');
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="p-2 border border-border rounded-lg hover:bg-accent transition"
                    title="Copier"
                  >
                    {copied ? <CheckCheck className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                ⚠️ Notez ce mot de passe maintenant. Il ne sera plus visible après fermeture.
              </p>
              <div className="flex justify-end">
                <button
                  onClick={() => { setGeneratedPassword(null); setCopied(false); }}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition"
                >
                  Fermer
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* ── Edit User Modal ───────────────────────────────────────────────── */}
        <Dialog open={editUser !== null} onOpenChange={() => setEditUser(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Modifier l&apos;utilisateur</DialogTitle>
              <DialogDescription>Modifiez les informations de {editUser?.name}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditUser} className="space-y-4 mt-2">
              <div>
                <label className="block text-sm font-medium mb-1">Nom complet *</label>
                <input required type="text" value={editForm.name}
                  onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input required type="email" value={editForm.email}
                  onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {editUser?.role.toLowerCase() === 'teacher' ? 'Formation assignée' : 'Formation actuelle'}
                </label>
                <input type="text" value={editForm.formation}
                  onChange={e => setEditForm(p => ({ ...p, formation: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              {editUser?.role.toLowerCase() === 'teacher' ? (
                <div>
                  <label className="block text-sm font-medium mb-1">Durée</label>
                  <input type="text" value={editForm.duree}
                    onChange={e => setEditForm(p => ({ ...p, duree: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium mb-1">Date de commencement</label>
                  <input type="date" value={editForm.dateDebut}
                    onChange={e => setEditForm(p => ({ ...p, dateDebut: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setEditUser(null)}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-accent transition">
                  Annuler
                </button>
                <button type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition">
                  Enregistrer
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* ── Add Teacher Modal ─────────────────────────────────────────────── */}
        <Dialog open={showAddTeacher} onOpenChange={setShowAddTeacher}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Ajouter un formateur</DialogTitle>
              <DialogDescription>Remplissez les informations du nouveau formateur</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddTeacher} className="space-y-4 mt-2">
              <div>
                <label className="block text-sm font-medium mb-1">Nom complet *</label>
                <input required type="text" value={teacherForm.name}
                  onChange={e => setTeacherForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Ex: Marie Dupont"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input required type="email" value={teacherForm.email}
                  onChange={e => setTeacherForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="formateur@email.com"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Cours assignés</label>
                {availableCourses.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucun cours disponible.</p>
                ) : (
                  <div className="max-h-48 overflow-y-auto border border-border rounded-lg divide-y divide-border">
                    {availableCourses.map(course => (
                      <label key={course.id} className="flex items-center gap-3 px-3 py-2 hover:bg-accent/30 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={teacherCourseIds.includes(course.id)}
                          onChange={e => {
                            setTeacherCourseIds(prev =>
                              e.target.checked ? [...prev, course.id] : prev.filter(id => id !== course.id)
                            );
                          }}
                          className="rounded border-border"
                        />
                        <span className="text-sm">{course.title}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAddTeacher(false)}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-accent transition">
                  Annuler
                </button>
                <button type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition">
                  Ajouter le formateur
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* ── User Detail Modal ─────────────────────────────────────────────── */}
        <Dialog open={selectedUser !== null} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Détails de l&apos;utilisateur</DialogTitle>
              <DialogDescription>Informations complètes sur {selectedUserObj?.name}</DialogDescription>
            </DialogHeader>
            {selectedUserObj && (
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Nom</div>
                  <div className="font-medium">{selectedUserObj.name}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Email</div>
                  <div className="font-medium">{selectedUserObj.email}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Rôle</div>
                  <Badge>
                    {selectedUserObj.role.toLowerCase() === 'student' ? 'Étudiant' : 'Formateur'}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Statut</div>
                  <div className="font-medium">{selectedUserObj.isActive ? 'Actif' : 'Inactif'}</div>
                </div>
                {selectedUserObj.formation && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">
                      {selectedUserObj.role.toLowerCase() === 'teacher' ? 'Formation assignée' : 'Formation actuelle'}
                    </div>
                    <div className="font-medium">{selectedUserObj.formation}</div>
                  </div>
                )}
                {selectedUserObj.duree && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Durée</div>
                    <div className="font-medium">{selectedUserObj.duree}</div>
                  </div>
                )}
                {selectedUserObj.dateDebut && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Date de commencement</div>
                    <div className="font-medium">{selectedUserObj.dateDebut}</div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

      </div>
    </AdminLayout>
  );
}
