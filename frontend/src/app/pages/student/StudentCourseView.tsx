import { StudentLayout } from '../../components/StudentLayout';
import { useParams, Link, useNavigate } from 'react-router';
import {
  CheckCircle,
  Lock,
  ChevronDown,
  ChevronUp,
  Video,
  FolderKanban,
  Award,
  BookOpen,
  FileQuestion,
  FileText,
  Download,
  Play,
} from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { coursesApi } from '../../../api/courses.api';
import { lessonsApi } from '../../../api/lessons.api';
import { LessonComments } from '../../components/LessonComments';
import { resourcesApi, CourseResource } from '../../../api/resources.api';
import { CourseRatingSection } from '../../components/CourseRatingSection';

type VideoProgressMap = Record<string, { watchedSeconds: number; durationSeconds: number }>;

/** SVG ring that shows watch percentage (0–100) for a lesson circle */
function ProgressRing({ pct, completed, active }: { pct: number; completed: boolean; active: boolean }) {
  const r = 8;
  const circ = 2 * Math.PI * r; // ≈ 50.27
  const dash = (pct / 100) * circ;

  if (completed) {
    return <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />;
  }

  return (
    <svg width="20" height="20" viewBox="0 0 20 20" className="flex-shrink-0 -rotate-90">
      {/* track */}
      <circle cx="10" cy="10" r={r} fill="none" stroke="currentColor"
        strokeWidth="2" className="text-muted-foreground/20" />
      {/* progress */}
      {pct > 0 && (
        <circle cx="10" cy="10" r={r} fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          className={active ? 'text-primary' : 'text-primary/70'}
        />
      )}
    </svg>
  );
}

export function StudentCourseView() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [progress, setProgress] = useState<{ completedLessonIds: string[]; videoProgress: VideoProgressMap }>({
    completedLessonIds: [],
    videoProgress: {},
  });
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [courseResources, setCourseResources] = useState<CourseResource[]>([]);
  // live watched % for the currently-playing lesson
  const [currentWatchedPct, setCurrentWatchedPct] = useState(0);
  // true while the student is playing ahead of their earned position
  const [isSkipping, setIsSkipping] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  // highest timestamp the student has honestly watched (high-water mark)
  const maxWatchedRef = useRef(0);
  const hasAutoCompletedRef = useRef(false);
  // save-throttle: only POST to server every 5 s
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSaveRef = useRef(false);
  const selectedLessonRef = useRef<any>(null);
  // ref mirror of isSkipping (accessible inside event handlers without stale closure)
  const isSkippingRef = useRef(false);

  /* ── helpers ─────────────────────────────────────────────── */

  const fetchProgress = useCallback(async () => {
    if (!courseId) return;
    try {
      const p = await coursesApi.getProgress(courseId);
      setProgress({
        completedLessonIds: p.completedLessonIds || [],
        videoProgress: p.videoProgress || {},
      });
    } catch {}
  }, [courseId]);

  const loadVideo = async (lesson: any) => {
    if (!lesson?.videoUrl) { setVideoSrc(null); return; }
    try {
      const { url } = await lessonsApi.getVideoUrl(lesson.id);
      setVideoSrc(url);
    } catch {
      setVideoSrc(lesson.videoUrl);
    }
  };

  /* ── initial load ─────────────────────────────────────────── */

  useEffect(() => {
    if (!courseId) { setLoading(false); return; }
    Promise.all([
      coursesApi.getById(courseId),
      coursesApi.getProgress(courseId).catch(() => ({ completedLessonIds: [], videoProgress: {} })),
      resourcesApi.getResources(courseId).catch(() => []),
    ]).then(([c, p, res]) => {
      setCourse(c);
      setProgress({ completedLessonIds: p.completedLessonIds || [], videoProgress: p.videoProgress || {} });
      setCourseResources(res);
      const firstLesson = c?.modules?.[0]?.lessons?.[0];
      if (firstLesson) {
        setSelectedLesson(firstLesson);
        selectedLessonRef.current = firstLesson;
        const saved = (p.videoProgress || {})[firstLesson.id];
        maxWatchedRef.current = saved?.watchedSeconds || 0;
        hasAutoCompletedRef.current = (p.completedLessonIds || []).includes(firstLesson.id);
        isSkippingRef.current = false;
        setIsSkipping(false);
        setCurrentWatchedPct(saved && saved.durationSeconds > 0
          ? Math.min((saved.watchedSeconds / saved.durationSeconds) * 100, 100) : 0);
        loadVideo(firstLesson);
      }
      if (c?.modules?.[0]) setExpandedSections([c.modules[0].id]);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [courseId]);

  /* ── flush pending save when leaving ─────────────────────── */

  useEffect(() => {
    return () => {
      if (pendingSaveRef.current && selectedLessonRef.current && videoRef.current) {
        const { duration } = videoRef.current;
        lessonsApi.saveVideoProgress(
          selectedLessonRef.current.id,
          maxWatchedRef.current,
          duration || 0,
        ).catch(() => {});
      }
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  /* ── derived ─────────────────────────────────────────────── */

  const isCompleted = (lessonId: string) => progress.completedLessonIds.includes(lessonId);

  /* ── video: seek to saved position once metadata is known ── */

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;
    const saved = maxWatchedRef.current;
    if (saved > 0 && saved < video.duration) {
      video.currentTime = saved;
    }
  };

  /* ── video: throttled progress save ─────────────────────── */

  const scheduleSave = (lessonId: string, watchedSeconds: number, durationSeconds: number) => {
    pendingSaveRef.current = true;
    if (saveTimerRef.current) return; // already scheduled
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null;
      pendingSaveRef.current = false;
      lessonsApi.saveVideoProgress(lessonId, watchedSeconds, durationSeconds).catch(() => {});
    }, 5000);
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    const lesson = selectedLessonRef.current;
    if (!video || !lesson) return;
    const { currentTime, duration } = video;
    if (!duration || isNaN(duration)) return;

    // ── Skip detection ──────────────────────────────────────────────────────
    // Allow up to 2 s of natural playback drift / tiny rewinds.
    // Any position beyond that is considered a skip-forward.
    const TOLERANCE = 2;
    const isAhead = currentTime > maxWatchedRef.current + TOLERANCE;

    if (isAhead) {
      // Student is playing ahead of their earned position – freeze tracking
      if (!isSkippingRef.current) {
        isSkippingRef.current = true;
        setIsSkipping(true);
      }
      return; // do NOT advance the high-water mark
    }

    // Back inside the valid zone → resume tracking
    if (isSkippingRef.current) {
      isSkippingRef.current = false;
      setIsSkipping(false);
    }

    // ── Advance high-water mark only forward ────────────────────────────────
    if (currentTime > maxWatchedRef.current) {
      maxWatchedRef.current = currentTime;
      setCurrentWatchedPct(Math.min((maxWatchedRef.current / duration) * 100, 100));
      scheduleSave(lesson.id, maxWatchedRef.current, duration);
      setProgress(prev => ({
        ...prev,
        videoProgress: {
          ...prev.videoProgress,
          [lesson.id]: { watchedSeconds: maxWatchedRef.current, durationSeconds: duration },
        },
      }));
    }

    // ── Auto-complete at 90% ────────────────────────────────────────────────
    if (
      !hasAutoCompletedRef.current &&
      !isCompleted(lesson.id) &&
      maxWatchedRef.current / duration >= 0.9
    ) {
      hasAutoCompletedRef.current = true;
      lessonsApi.complete(lesson.id)
        .then(() => fetchProgress())
        .catch(() => {});
    }
  };

  /* ── lesson selection ─────────────────────────────────────── */

  const handleSelectLesson = (lesson: any) => {
    if (!isUnlockedHelper(lesson.id)) return;
    // Flush save for the previous lesson immediately
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    if (pendingSaveRef.current && selectedLessonRef.current && videoRef.current) {
      const { duration } = videoRef.current;
      lessonsApi.saveVideoProgress(
        selectedLessonRef.current.id,
        maxWatchedRef.current,
        duration || 0,
      ).catch(() => {});
      pendingSaveRef.current = false;
    }

    selectedLessonRef.current = lesson;
    setSelectedLesson(lesson);

    const saved = progress.videoProgress[lesson.id];
    maxWatchedRef.current = saved?.watchedSeconds || 0;
    hasAutoCompletedRef.current = isCompleted(lesson.id);
    isSkippingRef.current = false;
    setIsSkipping(false);
    setCurrentWatchedPct(saved && saved.durationSeconds > 0
      ? Math.min((saved.watchedSeconds / saved.durationSeconds) * 100, 100) : 0);

    loadVideo(lesson);
  };

  /* ── loading / not-found screens ─────────────────────────── */

  if (loading) {
    return (
      <StudentLayout>
        <div className="max-w-7xl mx-auto">
          <div className="bg-white border border-border rounded-xl p-12 text-center text-muted-foreground">
            Chargement du cours...
          </div>
        </div>
      </StudentLayout>
    );
  }

  if (!course) {
    return (
      <StudentLayout>
        <div className="max-w-7xl mx-auto">
          <div className="bg-white border border-border rounded-xl p-12 text-center">
            <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Cours introuvable</h2>
            <Link to="/student/courses" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition">
              Retour à mes cours
            </Link>
          </div>
        </div>
      </StudentLayout>
    );
  }

  /* ── derived from course structure ───────────────────────── */

  const allLessons: any[] = (course.modules || []).flatMap((m: any) => m.lessons || []);
  const totalLessons = allLessons.length;
  const completedCount = progress.completedLessonIds.length;
  const progressPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  const isUnlockedHelper = (lessonId: string): boolean => {
    const idx = allLessons.findIndex(l => l.id === lessonId);
    if (idx <= 0) return true;
    return progress.completedLessonIds.includes(allLessons[idx - 1].id);
  };

  const toggleSection = (moduleId: string) => {
    setExpandedSections(prev =>
      prev.includes(moduleId) ? prev.filter(id => id !== moduleId) : [...prev, moduleId]
    );
  };

  /* ── render ───────────────────────────────────────────────── */

  return (
    <StudentLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link to="/student/courses" className="text-primary hover:underline mb-2 inline-block">
            ← Retour à mes cours
          </Link>
          <h1 className="mb-2">{course.title}</h1>
          <p className="text-muted-foreground">Par {course.teacher?.name || 'Formateur'}</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* ── Left: Video + lesson info + comments ── */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-indigo-100 border-l-4 border-l-indigo-400 rounded-xl overflow-hidden shadow-sm">
              {videoSrc ? (
                <div className="aspect-video bg-black relative">
                  <video
                    ref={videoRef}
                    key={videoSrc}
                    src={videoSrc}
                    className="w-full h-full"
                    controls
                    controlsList="nodownload"
                    onLoadedMetadata={handleLoadedMetadata}
                    onTimeUpdate={handleTimeUpdate}
                  />
                  {/* Skip-forward warning overlay */}
                  {isSkipping && (
                    <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-black/80 text-white text-sm px-4 py-2 rounded-full flex items-center gap-2 pointer-events-none whitespace-nowrap">
                      <span>⏪</span>
                      Revenez à votre position pour continuer la progression
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-video bg-black flex items-center justify-center">
                  <div className="text-center text-white">
                    <Play className="w-16 h-16 mx-auto mb-4 opacity-60" />
                    <p>{selectedLesson?.title || 'Sélectionnez une leçon'}</p>
                    {selectedLesson?.duration && (
                      <p className="text-sm text-white/70 mt-2">{selectedLesson.duration}</p>
                    )}
                  </div>
                </div>
              )}

              {selectedLesson && (
                <div className="p-6 space-y-4">
                  <div>
                    <h2 className="mb-2">{selectedLesson.title}</h2>
                    <div className="flex flex-wrap items-center gap-3">
                      {selectedLesson.duration && (
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Video className="w-4 h-4" />
                          {selectedLesson.duration}
                        </span>
                      )}
                      {isCompleted(selectedLesson.id) ? (
                        <>
                          <span className="flex items-center gap-2 text-teal-600 text-sm font-medium">
                            <CheckCircle className="w-4 h-4" /> Leçon complétée
                          </span>
                          {selectedLesson.quiz && (
                            <button
                              onClick={() => navigate(`/student/quiz/${courseId}/${selectedLesson.id}`)}
                              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 text-sm"
                            >
                              <Award className="w-4 h-4" />
                              Passer le quiz de la leçon
                            </button>
                          )}
                        </>
                      ) : isSkipping ? (
                        <span className="flex items-center gap-2 text-orange-600 text-sm font-medium">
                          ⏩ Vous avez avancé trop vite — revenez à{' '}
                          <strong>
                            {Math.floor(maxWatchedRef.current / 60)}:{String(Math.floor(maxWatchedRef.current % 60)).padStart(2, '0')}
                          </strong>{' '}
                          pour reprendre la progression ({Math.round(currentWatchedPct)}% acquis)
                        </span>
                      ) : (
                        <span className="flex items-center gap-2 text-indigo-600 text-sm font-medium">
                          <Video className="w-4 h-4" />
                          Regardez la vidéo jusqu'à 90% pour valider la leçon
                          {currentWatchedPct > 0 && (
                            <span className="font-semibold">({Math.round(currentWatchedPct)}%)</span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Lesson description */}
                  {selectedLesson.description && (
                    <div className="border-t border-border pt-4">
                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                        {selectedLesson.description}
                      </p>
                    </div>
                  )}

                  {/* Resources published by admin / teacher */}
                  {courseResources.length > 0 && (
                    <div className="border-t border-border pt-4">
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-600" />
                        Ressources du cours
                      </h4>
                      <div className="space-y-2">
                        {courseResources.map(r => (
                          <a
                            key={r.id}
                            href={r.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 rounded-lg border border-indigo-100 hover:bg-indigo-50 transition group"
                          >
                            <div className="p-1.5 bg-indigo-50 rounded-md flex-shrink-0">
                              <FileText className="w-4 h-4 text-indigo-600" />
                            </div>
                            <span className="flex-1 text-sm font-medium truncate group-hover:text-primary transition">
                              {r.title}
                            </span>
                            <Download className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {selectedLesson && (
              <LessonComments lessonId={selectedLesson.id} />
            )}
          </div>

          {/* ── Right Sidebar ── */}
          <div className="space-y-6">
            {/* Contenu du cours */}
            <div className="bg-white border border-indigo-100 border-l-4 border-l-indigo-400 rounded-xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-indigo-100 bg-indigo-50/40">
                <h3>Contenu du cours</h3>
              </div>
              <div className="max-h-[500px] overflow-y-auto">
                {(course.modules || []).map((module: any) => (
                  <div key={module.id} className="border-b border-border last:border-b-0">
                    <button
                      onClick={() => toggleSection(module.id)}
                      className="w-full p-4 flex items-center justify-between hover:bg-accent transition"
                    >
                      <span className="font-medium">{module.title}</span>
                      {expandedSections.includes(module.id) ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>

                    {expandedSections.includes(module.id) && (
                      <div className="bg-accent/30">
                        {(module.lessons || []).map((lesson: any) => {
                          const unlocked = isUnlockedHelper(lesson.id);
                          const completed = isCompleted(lesson.id);
                          const active = selectedLesson?.id === lesson.id;

                          // Determine ring percentage for this lesson
                          let ringPct = 0;
                          if (active) {
                            // Live value while watching
                            ringPct = currentWatchedPct;
                          } else {
                            const vp = progress.videoProgress[lesson.id];
                            if (vp && vp.durationSeconds > 0) {
                              ringPct = Math.min((vp.watchedSeconds / vp.durationSeconds) * 100, 100);
                            }
                          }

                          return (
                            <button
                              key={lesson.id}
                              onClick={() => handleSelectLesson(lesson)}
                              disabled={!unlocked}
                              className={`w-full p-4 flex items-center gap-3 hover:bg-accent transition text-left
                                ${active ? 'bg-accent' : ''}
                                ${!unlocked ? 'opacity-50 cursor-not-allowed' : ''}
                              `}
                            >
                              {!unlocked ? (
                                <Lock className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                              ) : (
                                <ProgressRing pct={ringPct} completed={completed} active={active} />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{lesson.title}</div>
                                {lesson.duration && (
                                  <div className="text-sm text-muted-foreground">{lesson.duration}</div>
                                )}
                              </div>
                              {lesson.quiz && completed && (
                                <FileQuestion className="w-4 h-4 text-primary/60 flex-shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Progression — inside Contenu du cours */}
              <div className="p-4 border-t border-indigo-100">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">{completedCount} / {totalLessons} leçons</span>
                  <span className="font-semibold text-teal-600">{progressPct}%</span>
                </div>
                <div className="w-full h-2 bg-teal-100 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-500 transition-all" style={{ width: `${progressPct}%` }} />
                </div>
              </div>
            </div>

            {/* Project */}
            <div className="bg-white border border-violet-100 border-l-4 border-l-violet-400 rounded-xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-violet-100 bg-violet-50/40">
                <h3>Projet du cours</h3>
              </div>
              <div className="p-4">
                <Link
                  to={`/student/projects/${courseId}`}
                  className="w-full px-4 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition text-center flex items-center justify-center gap-2"
                >
                  <FolderKanban className="w-5 h-5" />
                  Voir les projets
                </Link>
              </div>
            </div>

            {/* Rating */}
            <CourseRatingSection courseId={courseId!} canRate={progressPct === 100} />
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}

