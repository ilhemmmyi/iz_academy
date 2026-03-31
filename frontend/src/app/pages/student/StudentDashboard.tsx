import { StudentLayout } from '../../components/StudentLayout';
import { Link } from 'react-router';
import {
  BookOpen,
  Clock,
  Award,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useEffect, useState } from 'react';
import { enrollmentsApi } from '../../../api/enrollments.api';

export function StudentDashboard() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    enrollmentsApi.getMine()
      .then(data => setEnrollments(data.filter((e: any) => e.status === 'APPROVED')))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    { label: 'Cours en cours', value: String(enrollments.length), icon: BookOpen, iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600', borderAccent: 'border-l-indigo-400', borderColor: 'border-indigo-100' },
    { label: "Heures d'apprentissage", value: '0h', icon: Clock, iconBg: 'bg-teal-50', iconColor: 'text-teal-600', borderAccent: 'border-l-teal-400', borderColor: 'border-teal-100' },
    { label: 'Certificats obtenus', value: '0', icon: Award, iconBg: 'bg-amber-50', iconColor: 'text-amber-600', borderAccent: 'border-l-amber-400', borderColor: 'border-amber-100' },
    { label: 'Progression moyenne', value: '0%', icon: TrendingUp, iconBg: 'bg-violet-50', iconColor: 'text-violet-600', borderAccent: 'border-l-violet-400', borderColor: 'border-violet-100' },
  ];

  return (
    <StudentLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="mb-2">Tableau de bord</h1>
          <p className="text-muted-foreground">
            Bienvenue, {user?.name || 'Étudiant'} ! Continuez votre apprentissage.
          </p>
        </div>

        {/* Stats Grid */}
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

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Current Courses */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2>Mes cours en cours</h2>
              <Link
                to="/student/courses"
                className="text-primary hover:underline flex items-center gap-1"
              >
                Voir tout
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {loading ? (
              <div className="bg-white border border-border rounded-xl p-12 text-center text-muted-foreground">
                Chargement...
              </div>
            ) : enrollments.length === 0 ? (
              <div className="bg-white border border-border rounded-xl p-12 text-center">
                <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucun cours pour le moment</h3>
                <p className="text-muted-foreground mb-6">
                  Explorez notre catalogue et inscrivez-vous à un cours pour commencer.
                </p>
                <Link
                  to="/courses"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition"
                >
                  Découvrir les cours
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {enrollments.map((enrollment: any) => (
                  <div
                    key={enrollment.id}
                    className="bg-white border border-teal-100 border-l-4 border-l-teal-400 rounded-xl p-6 shadow-sm hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="mb-1">{enrollment.course.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          Par {enrollment.course.teacher?.name || 'Formateur'}
                        </p>
                      </div>
                      <Link
                        to={`/student/course/${enrollment.course.id}`}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition"
                      >
                        Continuer
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="space-y-6">
            <h2>Activité récente</h2>
            <div className="bg-white border border-indigo-100 border-l-4 border-l-indigo-300 rounded-xl p-8 text-center shadow-sm">
              <Clock className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                Aucune activité récente. Commencez un cours !
              </p>
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
