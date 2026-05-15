import { StudentLayout } from '../../components/StudentLayout';
import { Link } from 'react-router';
import {
  BookOpen,
  Clock,
  Award,
  ArrowRight,
  MessageCircle,
  MessageSquare,
  FolderKanban,
  Activity,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useEffect, useMemo, useState } from 'react';
import { enrollmentsApi } from '../../../api/enrollments.api';
import { activitiesApi, Activity as ActivityType } from '../../../api/activities.api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

// ── color palette for course segments ────────────────────────────────────────
const COURSE_COLORS = [
  '#6366f1', '#14b8a6', '#f59e0b', '#8b5cf6',
  '#ef4444', '#10b981', '#f43f5e', '#0ea5e9',
];

// ── SVG donut component ───────────────────────────────────────────────────────
function ProgressDonut({ courses }: { courses: { title: string; pct: number; color: string }[] }) {
  const cx = 70, cy = 70, r = 50, sw = 14;
  const circumference = 2 * Math.PI * r;
  const n = courses.length;
  const avg = n > 0 ? Math.round(courses.reduce((s, c) => s + c.pct, 0) / n) : 0;

  // Each course gets equal slice; fill = sliceSize * (pct/100)
  const sliceSize = n > 0 ? circumference / n : circumference;
  let offset = 0; // clockwise from top: start at -90deg = dashoffset trick

  const segments = courses.map((c, i) => {
    const filled = sliceSize * (c.pct / 100);
    const gap = circumference - filled;
    const seg = (
      <circle
        key={i}
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={c.color}
        strokeWidth={sw}
        strokeDasharray={`${filled} ${gap}`}
        strokeDashoffset={-(offset) + circumference / 4} // rotate to start from top
        strokeLinecap="butt"
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
    );
    offset += sliceSize;
    return seg;
  });

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <svg width={140} height={140}>
          {/* background track */}
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={sw} />
          {n === 0 ? (
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e2e8f0" strokeWidth={sw} />
          ) : segments}
        </svg>
        {/* center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold">{avg}%</span>
          <span className="text-xs text-muted-foreground">moyenne</span>
        </div>
      </div>

      {/* legend */}
      {n > 0 && (
        <div className="w-full space-y-1.5">
          {courses.map((c, i) => (
            <div key={i} className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.color }} />
                <span className="truncate text-muted-foreground">{c.title}</span>
              </div>
              <span className="font-medium shrink-0">{c.pct}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── time-ago helper ───────────────────────────────────────────────────────────
function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "À l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h}h`;
  const day = Math.floor(h / 24);
  if (day < 7) return `il y a ${day}j`;
  return new Date(d).toLocaleDateString('fr-FR');
}

// ─────────────────────────────────────────────────────────────────────────────
export function StudentDashboard() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [watchStats, setWatchStats] = useState<{ day: string; seconds: number }[]>([]);

  useEffect(() => {
    enrollmentsApi.getMine()
      .then(data => setEnrollments(data.filter((e: any) => e.status === 'APPROVED')))
      .catch(() => {})
      .finally(() => setLoading(false));
    activitiesApi.getMyActivities()
      .then(setActivities)
      .catch(() => {})
      .finally(() => setActivitiesLoading(false));
    enrollmentsApi.getWatchStats()
      .then(setWatchStats)
      .catch(() => {});
  }, []);

  // Active (non-completed) courses with progress data
  const activeCourses = useMemo(() =>
    enrollments
      .filter(e => e.progress && (e.progress.percentage ?? 0) < 100)
      .map((e, i) => ({
        title: e.course.title as string,
        pct: e.progress.percentage as number,
        color: COURSE_COLORS[i % COURSE_COLORS.length],
      })),
    [enrollments],
  );

  // Chart: today first (index 0), yesterday (index 1), … — convert seconds to minutes
  const chartData = useMemo(() => {
    return watchStats.map(s => ({
      day: s.day,
      minutes: Math.round(s.seconds / 60),
    }));
  }, [watchStats]);

  const certCount = enrollments.filter(e => e.progress?.certificate?.fileUrl).length;
  const totalMinutes = chartData.reduce((s, d) => s + d.minutes, 0);
  const hoursLabel = totalMinutes >= 60
    ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`
    : `${totalMinutes} min`;

  const iconMap = {
    COMMENT_REPLY:  { Icon: MessageCircle, bg: 'bg-teal-50',   color: 'text-teal-600'   },
    MESSAGE:        { Icon: MessageSquare, bg: 'bg-indigo-50',  color: 'text-indigo-600' },
    PROJECT_UPDATE: { Icon: FolderKanban,  bg: 'bg-violet-50', color: 'text-violet-600' },
  } as const;

  return (
    <StudentLayout>
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Welcome banner */}
        <div className="overflow-hidden rounded-2xl border border-indigo-200 bg-indigo-50/80 shadow-sm">
          <div className="px-6 py-5 flex flex-col gap-4">
            <div>
              <p className="text-indigo-400 text-xs font-medium mb-0.5">Tableau de bord étudiant</p>
              <h1 className="text-xl font-bold text-indigo-900 mb-1">
                Bonjour, {user?.name?.split(' ')[0] || 'Étudiant'} 👋
              </h1>
              <p className="text-indigo-500 text-sm">
                Continuez sur votre lancée — chaque leçon vous rapproche de votre objectif.
              </p>
            </div>

            {/* Stat pills */}
            <div className="flex flex-wrap gap-2">
              {[
                { icon: BookOpen, label: 'Cours en cours', value: loading ? '…' : String(enrollments.length) },
                { icon: Clock,    label: 'Apprentissage',  value: loading ? '…' : hoursLabel },
                { icon: Award,    label: 'Certificats',    value: loading ? '…' : String(certCount) },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-2 bg-white border border-indigo-100 rounded-lg px-3 py-2">
                  <div className="p-1.5 bg-indigo-100 rounded-md shrink-0">
                    <s.icon className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <div className="text-base font-bold text-indigo-900 leading-tight">{s.value}</div>
                    <div className="text-[11px] text-indigo-400 leading-tight">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Progression + Chart */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Left (wide): Learning activity chart */}
          <div className="lg:col-span-2 bg-white border border-border rounded-xl p-6 shadow-sm flex flex-col gap-4">
            {/* Header row: title left, mini stats right */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-base font-semibold">Activité d'apprentissage</h2>
                <p className="text-xs text-muted-foreground mt-0.5">10 derniers jours</p>
              </div>
              {(() => {
                const total = chartData.reduce((s, d) => s + d.minutes, 0);
                const activeDays = chartData.filter(d => d.minutes > 0).length;
                const best = Math.max(...chartData.map(d => d.minutes));
                return (
                  <div className="flex items-center gap-2 flex-wrap">
                    {[
                      { label: 'Total', value: total >= 60 ? `${Math.floor(total/60)}h ${total%60}m` : `${total} min` },
                      { label: 'Jours actifs', value: `${activeDays}/10` },
                      { label: 'Meilleur jour', value: best >= 60 ? `${Math.floor(best/60)}h ${best%60}m` : `${best} min` },
                    ].map((s, i) => (
                      <div key={i} className="bg-indigo-50 rounded-lg px-3 py-1.5 text-center min-w-[68px]">
                        <div className="text-sm font-bold text-indigo-700 leading-tight">{s.value}</div>
                        <div className="text-[10px] text-indigo-400 leading-tight">{s.label}</div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit=" min" allowDecimals={false} />
                <Tooltip
                  formatter={(v: number) => [`${v} min`, 'Apprentissage']}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="minutes" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-muted-foreground">Estimé à 20 min par activité enregistrée</p>
          </div>

          {/* Right: Global circular progress */}
          <div className="bg-white border border-border rounded-xl p-6 shadow-sm flex flex-col">
            <h2 className="text-base font-semibold mb-4">Progression globale</h2>
            {loading ? (
              <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">Chargement...</div>
            ) : activeCourses.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center py-6">
                <ProgressDonut courses={[]} />
                <p className="text-xs text-muted-foreground mt-2">Aucun cours en cours</p>
                <Link to="/courses" className="text-xs text-primary hover:underline flex items-center gap-1">
                  Découvrir les cours <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            ) : (
              <ProgressDonut courses={activeCourses} />
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-muted-foreground" />
            <h2>Activité récente</h2>
          </div>
          {activitiesLoading ? (
            <div className="bg-white border border-border rounded-xl p-8 text-center text-muted-foreground text-sm">
              Chargement...
            </div>
          ) : activities.length === 0 ? (
            <div className="bg-white border border-indigo-100 border-l-4 border-l-indigo-300 rounded-xl p-8 text-center shadow-sm">
              <Clock className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground text-sm">
                Aucune activité récente. Commencez un cours !
              </p>
            </div>
          ) : (
            <div className="bg-white border border-border rounded-xl divide-y divide-border shadow-sm overflow-hidden">
              {activities.map(item => {
                const { Icon, bg, color } = iconMap[item.type as keyof typeof iconMap] ?? iconMap.MESSAGE;
                return (
                  <div key={item.id} className="flex items-start gap-3 px-5 py-4 hover:bg-accent/40 transition">
                    <div className={`p-2 rounded-lg ${bg} ${color} flex-shrink-0 mt-0.5`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-snug">{item.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{timeAgo(item.createdAt)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
}

