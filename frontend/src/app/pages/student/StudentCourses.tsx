import { StudentLayout } from '../../components/StudentLayout';
import { Link, useNavigate } from 'react-router';
import { BookOpen, ArrowRight, Clock, XCircle, Play } from 'lucide-react';
import { useEffect, useState } from 'react';
import { enrollmentsApi } from '../../../api/enrollments.api';

export function StudentCourses() {
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    enrollmentsApi.getMine()
      .then(data => setEnrollments(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const approved = enrollments.filter((e: any) => e.status === 'APPROVED');
  const pending = enrollments.filter((e: any) => e.status === 'PENDING');
  const rejected = enrollments.filter((e: any) => e.status === 'REJECTED');

  return (
    <StudentLayout>
      <div className="max-w-7xl mx-auto space-y-10">
        <div>
          <h1 className="mb-2">Mes cours</h1>
          <p className="text-muted-foreground">
            Continuez votre apprentissage et progressez vers vos objectifs
          </p>
        </div>

        {loading ? (
          <div className="bg-white border border-border rounded-xl p-12 text-center text-muted-foreground">
            Chargement...
          </div>
        ) : (
          <>
            {/* Approved courses */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Cours approuvés</h2>
              {approved.length === 0 ? (
                <div className="bg-white border border-border rounded-xl p-10 text-center">
                  <BookOpen className="w-14 h-14 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Vous n'avez aucun cours approuvé. Explorez notre catalogue pour demander l'accès.
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
                  {approved.map((enrollment: any) => (
                    <div
                      key={enrollment.id}
                      className="bg-white border border-teal-100 border-l-4 border-l-teal-400 rounded-xl p-6 shadow-sm hover:shadow-md transition"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          {enrollment.course.thumbnailUrl && (
                            <img
                              src={enrollment.course.thumbnailUrl}
                              alt={enrollment.course.title}
                              className="w-20 h-14 object-cover rounded-lg flex-shrink-0"
                            />
                          )}
                          <div className="min-w-0">
                            <h3 className="font-semibold mb-1 truncate">{enrollment.course.title}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">{enrollment.course.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Par {enrollment.course.teacher?.name || 'Formateur'}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => navigate(`/student/course/${enrollment.course.id}`)}
                          className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition text-sm font-medium"
                        >
                          <Play className="w-4 h-4" />
                          Continuer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Pending requests */}
            {(pending.length > 0 || rejected.length > 0) && (
              <section>
                <h2 className="text-xl font-semibold mb-4">Mes demandes d'inscription</h2>
                <div className="space-y-4">
                  {pending.map((enrollment: any) => (
                    <div
                      key={enrollment.id}
                      className="bg-white border border-amber-100 border-l-4 border-l-amber-400 rounded-xl p-6 flex items-center justify-between gap-4 shadow-sm"
                    >
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        {enrollment.course.thumbnailUrl && (
                          <img
                            src={enrollment.course.thumbnailUrl}
                            alt={enrollment.course.title}
                            className="w-20 h-14 object-cover rounded-lg flex-shrink-0"
                          />
                        )}
                        <div className="min-w-0">
                          <h3 className="font-semibold mb-1 truncate">{enrollment.course.title}</h3>
                          <p className="text-xs text-muted-foreground">
                            Par {enrollment.course.teacher?.name || 'Formateur'}
                          </p>
                        </div>
                      </div>
                      <span className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-medium">
                        <Clock className="w-4 h-4" />
                        En attente
                      </span>
                    </div>
                  ))}
                  {rejected.map((enrollment: any) => (
                    <div
                      key={enrollment.id}
                      className="bg-white border border-red-100 border-l-4 border-l-red-400 rounded-xl p-6 flex items-center justify-between gap-4 shadow-sm"
                    >
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        {enrollment.course.thumbnailUrl && (
                          <img
                            src={enrollment.course.thumbnailUrl}
                            alt={enrollment.course.title}
                            className="w-20 h-14 object-cover rounded-lg flex-shrink-0"
                          />
                        )}
                        <div className="min-w-0">
                          <h3 className="font-semibold mb-1 truncate">{enrollment.course.title}</h3>
                          <p className="text-xs text-muted-foreground">
                            Par {enrollment.course.teacher?.name || 'Formateur'}
                          </p>
                        </div>
                      </div>
                      <span className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-full text-sm font-medium">
                        <XCircle className="w-4 h-4" />
                        Refusée
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </StudentLayout>
  );
}
