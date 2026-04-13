import { AdminLayout } from '../../components/AdminLayout';
import { Link } from 'react-router';
import { Users, BookOpen, UserPlus, GraduationCap, Eye } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useState, useEffect } from 'react';
import { usersApi } from '../../../api/users.api';
import { coursesApi } from '../../../api/courses.api';
import { enrollmentsApi } from '../../../api/enrollments.api';
import { paymentsApi } from '../../../api/payments.api';

const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

// Shows 9 months starting from March of the current year (project launch month)
function groupByMonth<T extends { createdAt?: string }>(items: T[], valueKey?: keyof T) {
  const now = new Date();
  const PROJECT_START_MONTH = 2; // March = index 2
  const result = Array.from({ length: 9 }, (_, i) => {
    const d = new Date(now.getFullYear(), PROJECT_START_MONTH + i, 1);
    return { month: MONTHS_FR[d.getMonth()], year: d.getFullYear(), monthIndex: d.getMonth(), value: 0 };
  });
  items.forEach(item => {
    if (!item.createdAt) return;
    const d = new Date(item.createdAt);
    const slot = result.find(r => r.monthIndex === d.getMonth() && r.year === d.getFullYear());
    if (slot) slot.value += valueKey ? Number(item[valueKey] ?? 0) : 1;
  });
  return result.map(r => ({ month: r.month, value: r.value }));
}

export function AdminDashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      usersApi.getAll().catch(() => []),
      coursesApi.getAll().catch(() => []),
      enrollmentsApi.getAll().catch(() => []),
      paymentsApi.getAll().catch(() => []),
    ]).then(([u, c, e, p]) => {
      setUsers(Array.isArray(u) ? u : []);
      setCourses(Array.isArray(c) ? c : []);
      setEnrollments(Array.isArray(e) ? e : []);
      setPayments(Array.isArray(p) ? p : []);
    }).finally(() => setLoading(false));
  }, []);

  const teachers = users.filter(u => u.role === 'TEACHER');
  const students = users.filter(u => u.role === 'STUDENT');
  const recentUsers = [...users]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);
  const pendingRequests = enrollments.filter((e: any) => e.status === 'PENDING').length;

  const newStudentsChartData = groupByMonth(students).map(r => ({ month: r.month, students: r.value }));
  const revenueChartData = groupByMonth(payments, 'amount').map(r => ({ month: r.month, revenue: r.value }));

  const stats = [
    {
      label: 'Utilisateurs totaux',
      value: users.length,
      icon: Users,
      iconBg: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
      valueBg: 'bg-white',
      border: 'border-indigo-100',
      accent: 'border-l-4 border-l-indigo-400',
    },
    {
      label: 'Formateurs',
      value: teachers.length,
      icon: UserPlus,
      iconBg: 'bg-teal-50',
      iconColor: 'text-teal-600',
      valueBg: 'bg-white',
      border: 'border-teal-100',
      accent: 'border-l-4 border-l-teal-400',
    },
    {
      label: 'Étudiants',
      value: students.length,
      icon: GraduationCap,
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-600',
      valueBg: 'bg-white',
      border: 'border-violet-100',
      accent: 'border-l-4 border-l-violet-400',
    },
    {
      label: 'Cours actifs',
      value: courses.length,
      icon: BookOpen,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      valueBg: 'bg-white',
      border: 'border-amber-100',
      accent: 'border-l-4 border-l-amber-400',
    },
  ];

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="mb-2">Tableau de bord administrateur</h1>
            <p className="text-muted-foreground">Vue d'ensemble de la plateforme Iz Academy</p>
          </div>

        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div key={index} className={`${stat.valueBg} border ${stat.border} ${stat.accent} rounded-xl p-6 shadow-sm`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.iconBg} ${stat.iconColor}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${stat.iconBg} ${stat.iconColor}`}>
                  Total
                </span>
              </div>
              <div className="text-3xl font-bold mb-1 text-foreground">
                {loading ? '—' : stat.value}
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Graphiques */}
        <div className="grid lg:grid-cols-2 gap-8">
          <Card className="border-l-4 border-l-teal-400">
            <CardHeader><CardTitle className="text-base">Revenus mensuels (DT)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={revenueChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(v: number) => `${v}DT`}
                    contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#0d9488" strokeWidth={2.5} dot={{ r: 4, fill: '#0d9488' }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-violet-400">
            <CardHeader><CardTitle className="text-base">Nouvelles inscriptions</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={newStudentsChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }} />
                  <Bar dataKey="students" fill="#7c3aed" opacity={0.85} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Utilisateurs récents */}
          <div className="bg-white border border-border rounded-xl p-6">
            <h2 className="mb-6">Utilisateurs récents</h2>
            {loading ? (
              <p className="text-muted-foreground text-sm">Chargement...</p>
            ) : recentUsers.length === 0 ? (
              <p className="text-muted-foreground text-sm">Aucun utilisateur pour le moment.</p>
            ) : (
              <div className="space-y-4">
                {recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 bg-accent/50 rounded-lg">
                    <div>
                      <div className="font-medium mb-1">{user.name}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.role === 'STUDENT' ? 'bg-blue-100 text-blue-700' :
                        user.role === 'TEACHER' ? 'bg-green-100 text-green-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {user.role === 'STUDENT' ? 'Étudiant' : user.role === 'TEACHER' ? 'Formateur' : 'Admin'}
                      </span>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Link to="/admin/users" className="block mt-4">
              <Button variant="outline" className="w-full">
                <Eye className="w-4 h-4 mr-2" />
                Voir tous les utilisateurs
              </Button>
            </Link>
          </div>

          {/* Cours disponibles */}
          <div className="bg-white border border-border rounded-xl p-6">
            <h2 className="mb-6">Cours disponibles</h2>
            {loading ? (
              <p className="text-muted-foreground text-sm">Chargement...</p>
            ) : courses.length === 0 ? (
              <p className="text-muted-foreground text-sm">Aucun cours pour le moment.</p>
            ) : (
              <div className="space-y-4">
                {courses.slice(0, 5).map((course: any) => (
                  <div key={course.id} className="p-4 bg-accent/50 rounded-lg">
                    <div className="font-medium mb-1">{course.title}</div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{course.level || '—'}</span>
                      <span>{course.price != null ? `${course.price}DT` : 'Gratuit'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Link to="/admin/courses" className="block mt-4">
              <Button variant="outline" className="w-full">
                <Eye className="w-4 h-4 mr-2" />
                Voir tous les cours
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}