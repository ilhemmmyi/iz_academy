import { TeacherLayout } from '../../components/TeacherLayout';
import { Link } from 'react-router';
import { MessageSquare, BookOpen, TrendingUp, ClipboardList, FolderKanban, MessageCircle, Activity, ArrowRight } from 'lucide-react';import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { coursesApi } from '../../../api/courses.api';
import { messagesApi } from '../../../api/messages.api';
import { enrollmentsApi } from '../../../api/enrollments.api';
import { projectsApi } from '../../../api/projects.api';
import { lessonCommentsApi } from '../../../api/lessonComments.api';

type ActivityItem = {
  id: string;
  type: 'message' | 'submission' | 'comment';
  title: string;
  subtitle: string;
  date: string;
  href: string;
};

export function TeacherDashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      coursesApi.getMine().catch(() => []),
      messagesApi.getAll().catch(() => []),
      enrollmentsApi.getAll().catch(() => []),
      projectsApi.teacherSubmissions().catch(() => []),
    ]).then(([c, m, e, s]) => {
      setCourses(c);
      setMessages(m);
      setEnrollments(e);
      setSubmissions(s);
      // Fetch comments for all teacher courses
      const courseList = c as any[];
      if (courseList.length > 0) {
        Promise.all(courseList.map((course: any) =>
          lessonCommentsApi.getByCourse(course.id).catch(() => [])
        )).then(results => {
          setComments((results as any[][]).flat());
        });
      }
    }).finally(() => setLoading(false));
  }, []);

  const unreadMessages = messages.filter((m: any) => !m.read && m.receiverId === user?.id).length;
  const pendingProjects = submissions.filter((s: any) => s.status === 'PENDING').length;

  const stats = [
    { label: 'Mes cours', value: String(courses.length), icon: BookOpen, iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600', borderAccent: 'border-l-indigo-400', borderColor: 'border-indigo-100' },
    { label: 'Messages non lus', value: String(unreadMessages), icon: MessageSquare, iconBg: 'bg-teal-50', iconColor: 'text-teal-600', borderAccent: 'border-l-teal-400', borderColor: 'border-teal-100' },
    { label: 'Projets à corriger', value: String(pendingProjects), icon: ClipboardList, iconBg: 'bg-amber-50', iconColor: 'text-amber-600', borderAccent: 'border-l-amber-400', borderColor: 'border-amber-100' },
    { label: 'Étudiants inscrits', value: String(enrollments.filter((e: any) => e.status === 'APPROVED').length), icon: TrendingUp, iconBg: 'bg-violet-50', iconColor: 'text-violet-600', borderAccent: 'border-l-violet-400', borderColor: 'border-violet-100' },
  ];

  // Build unified activity feed sorted by date desc
  const activities: ActivityItem[] = [
    ...messages
      .filter((m: any) => m.receiverId === user?.id)
      .map((m: any) => ({
        id: `msg-${m.id}`,
        type: 'message' as const,
        title: `Message de ${m.sender?.name || 'un étudiant'}`,
        subtitle: m.content?.length > 80 ? m.content.slice(0, 80) + '\u2026' : m.content,
        date: m.createdAt,
        href: `/teacher/messages`,
      })),
    ...submissions.map((s: any) => ({
      id: `sub-${s.id}`,
      type: 'submission' as const,
      title: `Projet soumis par ${s.student?.name || 'un étudiant'}`,
      subtitle: s.project?.title || '',
      date: s.submittedAt,
      href: `/teacher/projects`,
    })),
    ...comments
      .filter((c: any) => c.author?.role === 'STUDENT')
      .map((c: any) => ({
        id: `cmt-${c.id}`,
        type: 'comment' as const,
        title: `Commentaire de ${c.author?.name || 'un étudiant'}`,
        subtitle: `${c.lesson?.title ? `Sur "${c.lesson.title}" \u2014 ` : ''}${c.content?.length > 70 ? c.content.slice(0, 70) + '\u2026' : c.content}`,
        date: c.createdAt,
        href: `/teacher/comments`,
      })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 20);

  const activityIcon = (type: ActivityItem['type']) => {
    if (type === 'message') return { icon: MessageCircle, bg: 'bg-teal-50', color: 'text-teal-600' };
    if (type === 'submission') return { icon: FolderKanban, bg: 'bg-amber-50', color: 'text-amber-600' };
    return { icon: MessageSquare, bg: 'bg-indigo-50', color: 'text-indigo-600' };
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "À l'instant";
    if (m < 60) return `il y a ${m} min`;
    const h = Math.floor(m / 60);
    if (h < 24) return `il y a ${h}h`;
    const d = Math.floor(h / 24);
    if (d < 7) return `il y a ${d}j`;
    return new Date(dateStr).toLocaleDateString('fr-FR');
  };

  return (
    <TeacherLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="mb-2">Tableau de bord formateur</h1>
          <p className="text-muted-foreground">
            Bienvenue, {user?.name || 'Formateur'} ! Voici un aperçu de votre activité.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div key={index} className={`bg-white border ${stat.borderColor} border-l-4 ${stat.borderAccent} rounded-xl p-6 shadow-sm`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.iconBg} ${stat.iconColor}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
              <div className="text-3xl font-bold mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          {/* ── Recent activity feed ── */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-muted-foreground" />
              <h2>Activités récentes</h2>
            </div>
            {loading ? (
              <div className="bg-white border border-border rounded-xl p-8 text-center text-muted-foreground">Chargement...</div>
            ) : activities.length === 0 ? (
              <div className="bg-white border border-border rounded-xl p-8 text-center text-muted-foreground">
                Aucune activité récente.
              </div>
            ) : (
              <div className="bg-white border border-border rounded-xl divide-y divide-border shadow-sm">
                {activities.map(item => {
                  const { icon: Icon, bg, color } = activityIcon(item.type);
                  return (
                    <Link
                      key={item.id}
                      to={item.href}
                      className="flex items-start gap-4 px-6 py-5 hover:bg-accent/40 transition group"
                    >
                      <div className={`p-2.5 rounded-lg ${bg} ${color} mt-0.5 flex-shrink-0`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-medium truncate group-hover:text-primary transition">{item.title}</p>
                        {item.subtitle && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.subtitle}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 mt-1">
                        <span className="text-sm text-muted-foreground">{timeAgo(item.date)}</span>
                        <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </TeacherLayout>
  );
}
