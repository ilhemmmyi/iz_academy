import { StudentLayout } from '../../components/StudentLayout';
import { Link, useNavigate } from 'react-router';
import { BookOpen, ArrowRight, Clock, XCircle, Play, Award, Lock } from 'lucide-react';
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
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {approved.map((enrollment: any) => {
                    const p = enrollment.progress;
                    const pct: number = p?.percentage ?? 0;
                    const cert = p?.certificate ?? null;
                    const certReady = pct >= 100 && cert?.fileUrl;

                    return (
                      <div
                        key={enrollment.id}
                        className="bg-white border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col"
                      >
                        {/* Thumbnail */}
                        {enrollment.course.thumbnailUrl ? (
                          <img
                            src={enrollment.course.thumbnailUrl}
                            alt={enrollment.course.title}
                            className="w-full h-36 object-cover"
                          />
                        ) : (
                          <div className="w-full h-36 bg-accent/40 flex items-center justify-center">
                            <BookOpen className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}

                        <div className="p-4 flex flex-col flex-1">
                          {/* Title + teacher — grows to fill available space */}
                          <div className="flex-1">
                            <h3 className="font-semibold text-sm leading-snug line-clamp-2">{enrollment.course.title}</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {enrollment.course.teacher?.name || 'Formateur'}
                            </p>
                          </div>

                          {/* Progress bar + button — always at bottom */}
                          <div className="mt-3 space-y-2">
                            {p && (
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${pct >= 100 ? 'bg-emerald-500' : 'bg-primary'}`}
                                    style={{ width: `${Math.min(pct, 100)}%` }}
                                  />
                                </div>
                                <span className="text-xs text-muted-foreground w-8 text-right shrink-0">{pct}%</span>
                                {certReady ? (
                                  <Link
                                    to={`/student/certificates/${cert.id}`}
                                    title="Voir votre certificat"
                                    className="shrink-0 text-emerald-500 hover:text-emerald-700 transition"
                                  >
                                    <Award className="w-4 h-4" />
                                  </Link>
                                ) : (
                                  <span title="Complétez le cours pour obtenir votre certificat" className="shrink-0 text-slate-300">
                                    <Lock className="w-4 h-4" />
                                  </span>
                                )}
                              </div>
                            )}
                            <button
                              onClick={() => navigate(`/student/course/${enrollment.course.id}`)}
                              className="w-full flex items-center justify-center gap-2 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition text-sm font-medium"
                            >
                              <Play className="w-3.5 h-3.5" />
                              Continuer
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
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
