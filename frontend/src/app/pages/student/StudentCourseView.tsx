import { StudentLayout } from '../../components/StudentLayout';
import { useParams, Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
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
  ExternalLink,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { coursesApi } from '../../../api/courses.api';
import { lessonsApi } from '../../../api/lessons.api';
import { LessonComments } from '../../components/LessonComments';
import { lessonResourcesApi, LessonResource as LessonRes } from '../../../api/lessonResources.api';

// Pour chaque leçon vidéo, on garde combien de secondes ont été regardées
// et la durée totale de la vidéo. Sert à calculer les pourcentages affichés.
type VideoProgressMap = Record<string, { watchedSeconds: number; durationSeconds: number }>;

/** Le petit rond avec l'anneau de progression à côté de chaque leçon (comme sur Instagram stories) */
function ProgressRing({ pct, completed, active }: { pct: number; completed: boolean; active: boolean }) {
  const r = 8;
  const circ = 2 * Math.PI * r; // périmètre du cercle (≈ 50.27)
  const dash = (pct / 100) * circ; // longueur du trait à colorier selon le %

  // Leçon finie → on affiche juste le check vert, pas besoin de l'anneau
  if (completed) {
    return <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />;
  }

  return (
    <svg width="20" height="20" viewBox="0 0 20 20" className="flex-shrink-0 -rotate-90">
      {/* le cercle gris en fond (la "piste") */}
      <circle cx="10" cy="10" r={r} fill="none" stroke="currentColor"
        strokeWidth="2" className="text-muted-foreground/20" />
      {/* le cercle coloré qui avance selon le % regardé */}
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
  const [progress, setProgress] = useState<{
    completedLessonIds: string[];
    videoProgress: VideoProgressMap;
    passedQuizLessonIds: string[];
    lessonDurations: Record<string, number>;
    projectStatus: string | null
    hasCertificate: boolean;
    accessExpiresAt: string | null;
    isExpired: boolean;
  }>({
    completedLessonIds: [],
    videoProgress: {},
    passedQuizLessonIds: [],
    lessonDurations: {},
    projectStatus: null,
    hasCertificate: false,
    accessExpiresAt: null,
    isExpired: false,
  });
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [lessonResources, setLessonResources] = useState<LessonRes[]>([]);
  // % regardé en direct, juste pour la leçon en cours de lecture
  const [currentWatchedPct, setCurrentWatchedPct] = useState(0);
  // true quand l'étudiant a fait avancer la barre de lecture plus loin que ce qu'il a réellement regardé
  const [isSkipping, setIsSkipping] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  // le point le plus loin que l'étudiant a vraiment regardé (on ne le fait jamais reculer)
  const maxWatchedRef = useRef(0);
  const hasAutoCompletedRef = useRef(false);
  // pour ne pas spammer le serveur : on sauvegarde au max toutes les 30s (sauf pause/seek → save direct)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSaveRef = useRef(false);
  const selectedLessonRef = useRef<any>(null);
  // copie de isSkipping dans une ref, pour la lire dans les handlers vidéo sans closure périmée
  const isSkippingRef = useRef(false);

  /* ── helpers ─────────────────────────────────────────────── */

  // Va chercher la progression du cours (leçons faites, vidéos vues, quiz réussis...)
  // On garde l'ancien lessonDurations en mémoire pour éviter de perdre des durées déjà connues.
  const fetchProgress = useCallback(async () => {
    if (!courseId) return;
    try {
      const p = await coursesApi.getProgress(courseId);
      setProgress(prev => ({
        completedLessonIds: p.completedLessonIds || [],
        videoProgress: p.videoProgress || {},
        passedQuizLessonIds: p.passedQuizLessonIds || [],
        lessonDurations: { ...(prev.lessonDurations || {}), ...(p.lessonDurations || {}) },
        projectStatus: p.projectStatus ?? null,
        hasCertificate: p.hasCertificate ?? false,
        accessExpiresAt: p.accessExpiresAt ?? null,
        isExpired: p.isExpired ?? false,
      }));
    } catch {}
  }, [courseId]);

  // Récupère l'URL réelle (signée/sécurisée) de la vidéo depuis l'API.
  // Si ça échoue, on retombe sur l'URL brute stockée dans la leçon.
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

  // Au tout premier affichage : on charge le cours, la progression et les ressources en parallèle,
  // puis on sélectionne automatiquement la 1ère leçon du 1er module pour que l'étudiant n'arrive pas sur une page vide.
  useEffect(() => {
    if (!courseId) { setLoading(false); return; }
    Promise.all([
      coursesApi.getById(courseId),
      coursesApi.getProgress(courseId).catch(() => ({ completedLessonIds: [], videoProgress: {} })),
    ]).then(([c, p]) => {
      setCourse(c);
      setProgress({ completedLessonIds: p.completedLessonIds || [], videoProgress: p.videoProgress || {}, passedQuizLessonIds: p.passedQuizLessonIds || [], lessonDurations: p.lessonDurations || {}, projectStatus: p.projectStatus ?? null, hasCertificate: p.hasCertificate ?? false, accessExpiresAt: p.accessExpiresAt ?? null, isExpired: p.isExpired ?? false });
      const firstLesson = c?.modules?.[0]?.lessons?.[0];
      if (firstLesson) {
        setSelectedLesson(firstLesson);
        selectedLessonRef.current = firstLesson;
        // si l'étudiant avait déjà regardé un peu cette leçon avant, on reprend où il en était
        const saved = (p.videoProgress || {})[firstLesson.id];
        maxWatchedRef.current = saved?.watchedSeconds || 0;
        hasAutoCompletedRef.current = (p.completedLessonIds || []).includes(firstLesson.id);
        isSkippingRef.current = false;
        setIsSkipping(false);
        setCurrentWatchedPct(saved && saved.durationSeconds > 0
          ? Math.min((saved.watchedSeconds / saved.durationSeconds) * 100, 100) : 0);
        loadVideo(firstLesson);
        lessonResourcesApi.getResources(firstLesson.id).then(setLessonResources).catch(() => {});
      }
      // on ouvre le 1er module par défaut dans la liste à droite
      if (c?.modules?.[0]) setExpandedSections([c.modules[0].id]);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [courseId]);

  /* ── flush pending save when leaving ─────────────────────── */

  // Si l'étudiant ferme l'onglet ou quitte la page pendant qu'une sauvegarde est en attente,
  // on ne veut pas perdre sa progression. On essaie donc de l'envoyer une dernière fois.
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (pendingSaveRef.current && selectedLessonRef.current && videoRef.current) {
        const { duration } = videoRef.current;
        // version "beacon" : garantie d'être envoyé au backendmême si la page se ferme juste après
        lessonsApi.saveVideoProgressBeacon(
          selectedLessonRef.current.id,
          maxWatchedRef.current,
          duration || 0,
        );
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);//Détecte quand tu fermes l’onglet ou refresh
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // cas d'une simple navigation interne (SPA) : on sauvegarde normalement
      flushSave();
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  /* ── derived ─────────────────────────────────────────────── */

  const isCompleted = (lessonId: string) => progress.completedLessonIds.includes(lessonId);

  /* ── video: seek to saved position once metadata is known ── */

  // Dès que le navigateur connait la durée de la vidéo, on enregistre cette durée
  // et on replace le curseur là où l'étudiant s'était arrêté la dernière fois.
  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    const lesson = selectedLessonRef.current;
    if (!video || !lesson) return;

    // On garde la vraie durée de la vidéo en state, même pour les leçons jamais regardées.
    // Sinon le calcul de progression globale du cours serait faux (durée inconnue = ignorée).
    if (video.duration && !isNaN(video.duration) && video.duration > 0) {
      setProgress(prev => ({
        ...prev,
        lessonDurations: {
          ...prev.lessonDurations,
          [lesson.id]: Math.max(prev.lessonDurations[lesson.id] ?? 0, video.duration),
        },
        videoProgress: {
          ...prev.videoProgress,
          [lesson.id]: {
            watchedSeconds: prev.videoProgress[lesson.id]?.watchedSeconds ?? 0,
            durationSeconds: Math.max(prev.videoProgress[lesson.id]?.durationSeconds ?? 0, video.duration),
          },
        },
      }));
    }

    const saved = maxWatchedRef.current;
    if (saved > 0 && saved < video.duration) {
      video.currentTime = saved;
    }
  };

  /* ── video: throttled progress save ─────────────────────── */

  // Envoie immédiatement la progression au serveur (utilisé sur pause/seek/changement de leçon).
  // On annule le timer en attente puisqu'on vient de sauvegarder "à la main".
  const flushSave = useCallback(() => {
    if (!pendingSaveRef.current || !selectedLessonRef.current) return;
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    pendingSaveRef.current = false;
    const duration = videoRef.current?.duration || 0;
    lessonsApi.saveVideoProgress(selectedLessonRef.current.id, maxWatchedRef.current, duration).catch(() => {});
  }, []);

  // Planifie une sauvegarde dans 30s si aucune n'est déjà prévue.
  // Ça évite d'appeler l'API à chaque "timeupdate" (qui se déclenche très souvent).
  const scheduleSave = () => {
    pendingSaveRef.current = true;
    if (saveTimerRef.current) return; // une sauvegarde est déjà programmée, pas besoin d'en rajouter une
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null;
      pendingSaveRef.current = false;
      if (!selectedLessonRef.current) return;
      const duration = videoRef.current?.duration || 0;
      lessonsApi.saveVideoProgress(selectedLessonRef.current.id, maxWatchedRef.current, duration).catch(() => {});
    }, 30000);
  };

  // Appelé en continu pendant la lecture vidéo (plusieurs fois par seconde).
  // Rôle : détecter si l'étudiant a "triché" en avançant la barre, mettre à jour le % regardé,
  // et marquer la leçon comme terminée automatiquement une fois la vidéo finie.
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    const lesson = selectedLessonRef.current;
    if (!video || !lesson) return;
    const { currentTime, duration } = video;
    if (!duration || isNaN(duration)) return;

    // ── Détection de "saut" en avant ─────────────────────────────────────────
    // On tolère 2s d'écart (lecture normale ou petit retour en arrière).
    // Au-delà, on considère que l'étudiant a fait glisser la barre de lecture en avant.
    const TOLERANCE = 2;
    const isAhead = currentTime > maxWatchedRef.current + TOLERANCE;

    if (isAhead) {
      // L'étudiant regarde plus loin que ce qu'il a "gagné" → on gèle le suivi de progression
      if (!isSkippingRef.current) {
        isSkippingRef.current = true;
        setIsSkipping(true);
      }
      return; // surtout ne pas avancer le point max regardé
    }

    // Revenu dans la zone autorisée → on reprend le suivi normalement
    if (isSkippingRef.current) {
      isSkippingRef.current = false;
      setIsSkipping(false);
    }

    // ── Le point max regardé ne peut qu'avancer, jamais reculer ─────────────
    if (currentTime > maxWatchedRef.current) {
      maxWatchedRef.current = currentTime;
      setCurrentWatchedPct(Math.min((maxWatchedRef.current / duration) * 100, 100));
      scheduleSave();
      setProgress(prev => ({
        ...prev,
        videoProgress: {
          ...prev.videoProgress,
          [lesson.id]: { watchedSeconds: maxWatchedRef.current, durationSeconds: duration },
        },
      }));
    }

    // ── Validation automatique à 100% ───────────────────────────────────────
    if (
      !hasAutoCompletedRef.current &&
      !isCompleted(lesson.id) &&
      maxWatchedRef.current / duration >= 1.0
    ) {
      hasAutoCompletedRef.current = true;
      lessonsApi.complete(lesson.id)
        .then(async () => {
          await fetchProgress();
          // La génération du certificat se fait en arrière-plan côté serveur (pas instantanée).
          // On revérifie 6s plus tard pour que le +10% apparaisse sans que l'étudiant doive recharger la page.
          setTimeout(() => fetchProgress(), 6000);
        })
        .catch(() => {});
    }
  };

  /* ── lesson selection ─────────────────────────────────────── */

  // Quand l'étudiant clique sur une leçon dans la liste à droite.
  const handleSelectLesson = (lesson: any) => {
    if (progress.isExpired) {
      toast.error("Votre accès à ce cours a expiré.");
      return;
    }
    // Leçon verrouillée (précédente pas finie, ou quiz pas réussi) → on bloque
    if (!isUnlockedHelper(lesson.id)) {
      if (isQuizBlockedHelper(lesson.id)) {
        toast.error('Vous devez réussir le quiz de la leçon précédente pour continuer');
      }
      return;
    }
    // On sauvegarde tout de suite la progression de la leçon qu'on quitte
    flushSave();

    selectedLessonRef.current = lesson;
    setSelectedLesson(lesson);

    // On reprend la nouvelle leçon là où elle en était (si déjà commencée avant)
    const saved = progress.videoProgress[lesson.id];
    maxWatchedRef.current = saved?.watchedSeconds || 0;
    hasAutoCompletedRef.current = isCompleted(lesson.id);
    isSkippingRef.current = false;
    setIsSkipping(false);
    setCurrentWatchedPct(saved && saved.durationSeconds > 0
      ? Math.min((saved.watchedSeconds / saved.durationSeconds) * 100, 100) : 0);

    loadVideo(lesson);
    // on recharge les ressources propres à cette leçon
    lessonResourcesApi.getResources(lesson.id).then(setLessonResources).catch(() => setLessonResources([]));
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
            <Link to="/student" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition">
              Retour à mes cours
            </Link>
          </div>
        </div>
      </StudentLayout>
    );
  }

  /* ── derived from course structure ───────────────────────── */

  // toutes les leçons du cours, peu importe le module, dans une seule liste à plat
  const allLessons: any[] = (course.modules || []).flatMap((m: any) => m.lessons || []);

  // Pour connaitre la durée d'une leçon, on prend la 1ère valeur disponible parmi 3 sources :
  // 1) la session de visionnage en cours, 2) les durées déjà connues en base, 3) la donnée du cours.
  const getLessonDuration = (l: any): number =>
    progress.videoProgress?.[l.id]?.durationSeconds
    || progress.lessonDurations?.[l.id]
    || l.durationSeconds
    || 0;

  // On utilise Math.max(..., 1) pour que les leçons dont on ne connait pas encore la durée
  // comptent quand même pour "1" au dénominateur, sinon le % global serait gonflé artificiellement.
  const totalDuration = allLessons.reduce((acc: number, l: any) => acc + Math.max(getLessonDuration(l), 1), 0);

  // Temps réellement regardé, plafonné à la durée de chaque leçon (même cap que totalDuration
  // pour que le ratio watched/total reste cohérent).
  const watchedDuration = allLessons.reduce((acc: number, l: any) => {
    const watched = progress.videoProgress[l.id]?.watchedSeconds || 0;
    const cap = Math.max(getLessonDuration(l), 1);
    return acc + Math.min(watched, cap);
  }, 0);

  // % basé sur le temps de vidéo regardé4
  //calcul pourcentage de toutes les  lessons
  const lessonPct = totalDuration > 0 ? Math.min(Math.round((watchedDuration / totalDuration) * 100), 100) : 0;
  // % global du cours : les vidéos comptent pour 70%, le projet pour 20%, le certificat pour 10%
  const progressPct = Math.min(
    Math.round(lessonPct * 0.7) + (progress.projectStatus ? 20 : 0) + (progress.hasCertificate ? 10 : 0),
    100,
  );

  // Transforme un nombre de secondes en texte lisible ("1 h 30 min", "5 min"...)
  const fmtDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const h = Math.floor(m / 60);
    const remMin = m % 60;
    if (h > 0) return remMin > 0 ? `${h} h ${remMin} min` : `${h} h`;
    if (m > 0) return `${m} min`;
    return '< 1 min';
  };

  // Une leçon est débloquée si : c'est la 1ère, OU la précédente est finie ET (si elle a un quiz) le quiz est réussi.
  const isUnlockedHelper = (lessonId: string): boolean => {
    const idx = allLessons.findIndex(l => l.id === lessonId);
    if (idx <= 0) return true;
    const prev = allLessons[idx - 1];
    if (!progress.completedLessonIds.includes(prev.id)) return false;
    // si la leçon précédente a un quiz, il faut l'avoir réussi pour avancer
    if (prev.quizId && !progress.passedQuizLessonIds.includes(prev.id)) return false;
    return true;
  };

  /** Distingue le cas "verrouillée car quiz pas réussi" du cas "verrouillée car vidéo pas finie" (pour afficher le bon message/icône). */
  const isQuizBlockedHelper = (lessonId: string): boolean => {
    const idx = allLessons.findIndex(l => l.id === lessonId);
    if (idx <= 0) return false;
    const prev = allLessons[idx - 1];
    if (!progress.completedLessonIds.includes(prev.id)) return false; // verrouillée à cause de la vidéo, pas du quiz
    return !!prev.quizId && !progress.passedQuizLessonIds.includes(prev.id);
  };

  // Ouvre/ferme un module dans la liste des leçons à droite
  const toggleSection = (moduleId: string) => {
    setExpandedSections(prev =>
      prev.includes(moduleId) ? prev.filter(id => id !== moduleId) : [...prev, moduleId]
    );
  };

  // Combien de jours restent avant que l'accès au cours expire (null = pas de date d'expiration)
  const daysRemaining = (): number | null => {
    if (!progress.accessExpiresAt) return null;
    const diff = new Date(progress.accessExpiresAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  /* ── render ───────────────────────────────────────────────── */

  // Full-page expired screen
  if (progress.isExpired) {
    return (
      <StudentLayout>
        <div className="max-w-2xl mx-auto mt-16">
          <div className="bg-white border border-red-200 rounded-2xl p-10 text-center shadow-sm">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <Lock className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-red-700 mb-2">Accès expiré</h2>
            <p className="text-muted-foreground mb-1">
              Votre accès au cours <span className="font-semibold text-foreground">{course.title}</span> a expiré.
            </p>
            {progress.accessExpiresAt && (
              <p className="text-sm text-muted-foreground mb-6">
                Date d'expiration :{' '}
                {new Date(progress.accessExpiresAt).toLocaleDateString('fr-FR', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              </p>
            )}
            <p className="text-sm text-muted-foreground mb-6">
              Pour retrouver accès au contenu, contactez un administrateur ou réinscrivez-vous au cours.
            </p>
            <Link
              to="/student"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition text-sm font-medium"
            >
              Retour au tableau de bord
            </Link>
          </div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout liveProgress={{ courseId: courseId!, pct: progressPct }}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="mb-2">{course.title}</h1>
          <p className="text-muted-foreground">Par {course.teacher?.name || 'Formateur'}</p>

          {/* Access expiry warning (≤7 days remaining) */}
          {(() => {
            const days = daysRemaining();
            if (days === null || days > 7) return null;
            return (
              <div className={`mt-3 flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium ${
                days <= 2
                  ? 'bg-red-50 border border-red-200 text-red-700'
                  : 'bg-amber-50 border border-amber-200 text-amber-700'
              }`}>
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {days === 0
                  ? "Votre accès à ce cours expire aujourd'hui !"
                  : `Votre accès expire dans ${days} jour${days > 1 ? 's' : ''}.`}
                {progress.accessExpiresAt && (
                  <span className="ml-auto flex items-center gap-1 text-xs opacity-75">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(progress.accessExpiresAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                )}
              </div>
            );
          })()}
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
                    onPause={flushSave}
                    onSeeked={flushSave}
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
                      ) : null}
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

                  {/* Lesson-specific resources */}
                  {lessonResources.length > 0 && (
                    <div className="border-t border-border pt-4">
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-600" />
                        Ressources de cette leçon
                      </h4>
                      <div className="space-y-2">
                        {lessonResources.map(r => (
                          r.type === 'LINK' ? (
                            <a
                              key={r.id}
                              href={r.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 p-3 rounded-lg border border-emerald-100 hover:bg-emerald-50 transition group"
                            >
                              <div className="p-1.5 bg-emerald-50 rounded-md flex-shrink-0">
                                <ExternalLink className="w-4 h-4 text-emerald-600" />
                              </div>
                              <span className="flex-1 text-sm font-medium truncate group-hover:text-emerald-700 transition">
                                {r.title}
                              </span>
                              <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0 opacity-60" />
                            </a>
                          ) : (
                            <a
                              key={r.id}
                              href={r.url}
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
                          )
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

                          // % à afficher dans l'anneau de cette leçon
                          let ringPct = 0;
                          if (active) {
                            // c'est la leçon en cours de lecture → on utilise la valeur live
                            ringPct = currentWatchedPct;
                          } else {
                            const vp = progress.videoProgress[lesson.id];
                            if (vp && vp.durationSeconds > 0) {
                              ringPct = Math.min((vp.watchedSeconds / vp.durationSeconds) * 100, 100);
                            }
                          }

                          const quizBlocked = !unlocked && isQuizBlockedHelper(lesson.id);

                          return (
                            <button
                              key={lesson.id}
                              onClick={() => handleSelectLesson(lesson)}
                              disabled={!unlocked}
                              className={`w-full p-4 flex items-start gap-3 hover:bg-accent transition text-left
                                ${active ? 'bg-accent' : ''}
                                ${!unlocked ? 'opacity-60 cursor-not-allowed' : ''}
                              `}
                            >
                              {!unlocked ? (
                                quizBlocked ? (
                                  <FileQuestion className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                ) : (
                                  <Lock className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                                )
                              ) : (
                                <ProgressRing pct={ringPct} completed={completed} active={active} />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{lesson.title}</div>
                                {lesson.duration && (
                                  <div className="text-sm text-muted-foreground">{lesson.duration}</div>
                                )}
                                {quizBlocked && (
                                  <div className="text-xs text-amber-600 mt-1">
                                    Réussissez le quiz de la leçon précédente
                                  </div>
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
                  <span className="text-muted-foreground">{fmtDuration(watchedDuration)} / {fmtDuration(totalDuration)}</span>
                  <span className="font-semibold text-teal-600">{lessonPct}%</span>
                </div>
                <div className="w-full h-2 bg-teal-100 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-500 transition-all" style={{ width: `${lessonPct}%` }} />
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

          </div>
        </div>
      </div>
    </StudentLayout>
  );
}

