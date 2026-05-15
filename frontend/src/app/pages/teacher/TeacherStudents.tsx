import { TeacherLayout } from '../../components/TeacherLayout';
import { Search, Mail, BookOpen, Users, TrendingUp, CheckCircle } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { enrollmentsApi } from '../../../api/enrollments.api';
import { Link } from 'react-router';

interface StudentEnrollment {
  id: string;
  student: { id: string; name: string; email: string; avatarUrl: string | null };
  course: { id: string; title: string };
  enrolledAt: string;
  progress: { total: number; completed: number; percentage: number };
}

export function TeacherStudents() {
  const [enrollments, setEnrollments] = useState<StudentEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');

  useEffect(() => {
    enrollmentsApi.getTeacherStudents()
      .then((data: any) => setEnrollments(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Unique courses for filter
  const courses = useMemo(() => {
    const map = new Map<string, string>();
    enrollments.forEach(e => map.set(e.course.id, e.course.title));
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [enrollments]);

  // Unique students count
  const uniqueStudents = useMemo(() =>
    new Set(enrollments.map(e => e.student.id)).size, [enrollments]);

  const avgProgress = useMemo(() => {
    if (!enrollments.length) return 0;
    return Math.round(enrollments.reduce((acc, e) => acc + e.progress.percentage, 0) / enrollments.length);
  }, [enrollments]);

  const completedCount = enrollments.filter(e => e.progress.percentage === 100).length;

  const filtered = enrollments.filter(e => {
    const matchesSearch =
      e.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.course.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCourse = selectedCourse === 'all' || e.course.id === selectedCourse;
    return matchesSearch && matchesCourse;
  });

  const progressColor = (pct: number) => {
    if (pct === 100) return 'bg-teal-500';
    if (pct >= 60) return 'bg-indigo-500';
    if (pct >= 30) return 'bg-amber-500';
    return 'bg-rose-400';
  };

  const progressBadge = (pct: number) => {
    if (pct === 100) return 'bg-teal-50 text-teal-700 border-teal-200';
    if (pct >= 60) return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    if (pct >= 30) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-rose-50 text-rose-700 border-rose-200';
  };

  return (
    <TeacherLayout>
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <h1 className="mb-2">Mes étudiants</h1>
          <p className="text-muted-foreground">Suivez la progression de vos étudiants par cours</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-indigo-100 border-l-4 border-l-indigo-400 rounded-xl p-5 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-indigo-50 rounded-lg"><Users className="w-6 h-6 text-indigo-600" /></div>
            <div>
              <div className="text-2xl font-bold text-indigo-700">{loading ? '…' : uniqueStudents}</div>
              <div className="text-sm text-muted-foreground">Étudiants inscrits</div>
            </div>
          </div>
          <div className="bg-white border border-teal-100 border-l-4 border-l-teal-400 rounded-xl p-5 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-teal-50 rounded-lg"><TrendingUp className="w-6 h-6 text-teal-600" /></div>
            <div>
              <div className="text-2xl font-bold text-teal-700">{loading ? '…' : `${avgProgress}%`}</div>
              <div className="text-sm text-muted-foreground">Progression moyenne</div>
            </div>
          </div>
          <div className="bg-white border border-violet-100 border-l-4 border-l-violet-400 rounded-xl p-5 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-violet-50 rounded-lg"><CheckCircle className="w-6 h-6 text-violet-600" /></div>
            <div>
              <div className="text-2xl font-bold text-violet-700">{loading ? '…' : completedCount}</div>
              <div className="text-sm text-muted-foreground">Cours complétés</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Rechercher un étudiant ou cours..."
              className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>
          <select
            value={selectedCourse}
            onChange={e => setSelectedCourse(e.target.value)}
            className="px-4 py-2.5 border border-border rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Tous les cours</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="bg-white border border-border rounded-xl p-12 text-center text-muted-foreground">Chargement…</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-border rounded-xl p-12 text-center">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Aucun étudiant trouvé.</p>
          </div>
        ) : (
          <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-accent/50 border-b border-border">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Étudiant</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cours</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Progression</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Leçons</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Inscrit le</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(e => (
                  <tr key={e.id} className="hover:bg-accent/20 transition-colors">
                    {/* Student */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-sm flex-shrink-0">
                          {e.student.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{e.student.name}</div>
                          <div className="text-xs text-muted-foreground">{e.student.email}</div>
                        </div>
                      </div>
                    </td>
                    {/* Course */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm">
                        <BookOpen className="w-4 h-4 text-teal-500 flex-shrink-0" />
                        <span className="truncate max-w-[160px]">{e.course.title}</span>
                      </div>
                    </td>
                    {/* Progress bar */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 min-w-[140px]">
                        <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full transition-all ${progressColor(e.progress.percentage)}`}
                            style={{ width: `${e.progress.percentage}%` }}
                          />
                        </div>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${progressBadge(e.progress.percentage)}`}>
                          {e.progress.percentage}%
                        </span>
                      </div>
                    </td>
                    {/* Lessons */}
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {e.progress.completed}/{e.progress.total} leçons
                    </td>
                    {/* Date */}
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(e.enrolledAt).toLocaleDateString('fr-FR')}
                    </td>
                    {/* Actions */}
                    <td className="px-6 py-4">
                      <Link
                        to={`/teacher/messages`}
                        state={{ contactId: e.student.id }}
                        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        Message
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </TeacherLayout>
  );
}
