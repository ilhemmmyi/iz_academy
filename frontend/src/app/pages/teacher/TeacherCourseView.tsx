import { TeacherLayout } from '../../components/TeacherLayout';
import { useParams, Link } from 'react-router';
import {
  Play,
  ChevronDown,
  ChevronUp,
  Video,
  BookOpen,
  ExternalLink,
  FolderKanban,
  ArrowLeft,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { coursesApi } from '../../../api/courses.api';
import { lessonsApi } from '../../../api/lessons.api';
import { lessonResourcesApi, LessonResource as LessonRes } from '../../../api/lessonResources.api';
import { LessonComments } from '../../components/LessonComments';
import { LessonResourceManager } from '../../components/LessonResourceManager';

export function TeacherCourseView() {
  const { courseId } = useParams();

  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);

  // Lesson resources (used by LessonResourceManager in the lesson panel)
  const [lessonResources, setLessonResources] = useState<LessonRes[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Project catalog for this course
  const [projects, setProjects] = useState<any[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);

  const loadVideo = async (lesson: any) => {
    if (!lesson?.videoUrl) { setVideoSrc(null); return; }
    try {
      const { url } = await lessonsApi.getVideoUrl(lesson.id);
      setVideoSrc(url);
    } catch {
      setVideoSrc(lesson.videoUrl);
    }
  };

  useEffect(() => {
    if (!courseId) { setLoading(false); return; }
    coursesApi.getById(courseId).then((c) => {
      setCourse(c);
      const firstLesson = c?.modules?.[0]?.lessons?.[0];
      if (firstLesson) {
        setSelectedLesson(firstLesson);
        loadVideo(firstLesson);
        lessonResourcesApi.getResources(firstLesson.id).then(setLessonResources).catch(() => setLessonResources([]));
      }
      if (c?.modules?.[0]) setExpandedSections([c.modules[0].id]);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [courseId]);

  // Load project catalog on mount
  useEffect(() => {
    if (!courseId) return;
    setProjectsLoading(true);
    import('../../../api/projects.api').then(({ projectsApi }) =>
      projectsApi.getByCourse(courseId)
    ).then((data: any[]) => setProjects(data))
    .catch(() => {})
    .finally(() => setProjectsLoading(false));
  }, [courseId]);

  const handleSelectLesson = (lesson: any) => {
    setSelectedLesson(lesson);
    loadVideo(lesson);
    lessonResourcesApi.getResources(lesson.id).then(setLessonResources).catch(() => setLessonResources([]));
  };

  const toggleSection = (moduleId: string) => {
    setExpandedSections(prev =>
      prev.includes(moduleId) ? prev.filter(id => id !== moduleId) : [...prev, moduleId]
    );
  };

  if (loading) {
    return (
      <TeacherLayout>
        <div className="max-w-7xl mx-auto">
          <div className="bg-white border border-border rounded-xl p-12 text-center text-muted-foreground">
            Chargement du cours...
          </div>
        </div>
      </TeacherLayout>
    );
  }

  if (!course) {
    return (
      <TeacherLayout>
        <div className="max-w-7xl mx-auto">
          <div className="bg-white border border-border rounded-xl p-12 text-center">
            <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Cours introuvable</h2>
            <Link to="/teacher/courses" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition">
              Retour à mes cours
            </Link>
          </div>
        </div>
      </TeacherLayout>
    );
  }

  const allLessons: any[] = (course.modules || []).flatMap((m: any) => m.lessons || []);

  return (
    <TeacherLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="mb-1">{course.title}</h1>
          <p className="text-muted-foreground text-sm">{allLessons.length} leçon{allLessons.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* ── Left: Video + sections ── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video player */}
            <div className="bg-white border border-border rounded-xl overflow-hidden">
              {videoSrc ? (
                <div className="aspect-video bg-black">
                  <video
                    key={videoSrc}
                    src={videoSrc}
                    className="w-full h-full"
                    controls
                    controlsList="nodownload"
                  />
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
                <div className="p-4 border-t border-border">
                  <h2 className="text-base font-semibold mb-1">{selectedLesson.title}</h2>
                  {selectedLesson.duration && (
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Video className="w-4 h-4" /> {selectedLesson.duration}
                    </span>
                  )}
                  <div className="mt-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Ressources de la leçon</p>
                    <LessonResourceManager
                      lessonId={selectedLesson.id}
                      resources={lessonResources}
                      onResourcesChange={setLessonResources}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Section Commentaires */}
            <div className="bg-white border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <h3 className="text-sm font-semibold">Commentaires</h3>
              </div>
              <div className="p-4">
                {selectedLesson ? (
                  <LessonComments lessonId={selectedLesson.id} />
                ) : (
                  <p className="text-muted-foreground text-sm text-center">Sélectionnez une leçon pour voir les commentaires.</p>
                )}
              </div>
            </div>

            {/* Section Projets */}
            <div className="bg-white border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <h3 className="text-sm font-semibold">Projets</h3>
              </div>
              <div className="p-4">
                {projectsLoading ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Chargement...</p>
                ) : projects.length === 0 ? (
                  <div className="text-center py-8">
                    <FolderKanban className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">Aucun projet pour ce cours.</p>
                  </div>
                ) : selectedProject ? (
                  <div className="space-y-4">
                    <button
                      onClick={() => setSelectedProject(null)}
                      className="text-primary hover:underline inline-flex items-center gap-1 text-sm"
                    >
                      <ArrowLeft className="w-4 h-4" /> Retour aux projets
                    </button>
                    <h2 className="text-lg font-semibold">{selectedProject.title}</h2>
                    <p className="text-muted-foreground text-sm">{selectedProject.description}</p>
                    <div className="border-t border-border pt-4">
                      <h3 className="font-semibold mb-2 text-sm">Instructions</h3>
                      <p className="text-sm whitespace-pre-wrap">{selectedProject.instructions}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {projects.map((project: any, index: number) => (
                      <button
                        key={project.id}
                        onClick={() => setSelectedProject(project)}
                        className="w-full text-left border border-border rounded-xl p-4 hover:border-primary hover:bg-accent/30 transition space-y-1"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-violet-100 text-violet-700 text-sm font-bold flex items-center justify-center flex-shrink-0">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{project.title}</p>
                            {project.description && (
                              <p className="text-xs text-muted-foreground truncate mt-0.5">{project.description}</p>
                            )}
                          </div>
                          <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Right sidebar: Contenu du cours ── */}
          <div className="bg-white border border-border rounded-xl overflow-hidden h-fit">
            <div className="p-4 border-b border-border">
              <h3>Contenu du cours</h3>
              <p className="text-xs text-muted-foreground mt-1">{allLessons.length} leçon{allLessons.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="max-h-[70vh] overflow-y-auto">
              {(course.modules || []).map((module: any) => (
                <div key={module.id} className="border-b border-border last:border-b-0">
                  <button
                    onClick={() => toggleSection(module.id)}
                    className="w-full p-4 flex items-center justify-between hover:bg-accent transition"
                  >
                    <span className="font-medium text-sm">{module.title}</span>
                    {expandedSections.includes(module.id)
                      ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </button>
                  {expandedSections.includes(module.id) && (
                    <div className="bg-accent/30">
                      {(module.lessons || []).map((lesson: any) => {
                        const active = selectedLesson?.id === lesson.id;
                        return (
                          <button
                            key={lesson.id}
                            onClick={() => handleSelectLesson(lesson)}
                            className={`w-full p-4 flex items-center gap-3 hover:bg-accent transition text-left ${active ? 'bg-accent' : ''}`}
                          >
                            <Play className={`w-4 h-4 flex-shrink-0 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                            <div className="flex-1 min-w-0">
                              <div className={`text-sm font-medium truncate ${active ? 'text-primary' : ''}`}>{lesson.title}</div>
                              {lesson.duration && (
                                <div className="text-xs text-muted-foreground">{lesson.duration}</div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </TeacherLayout>
  );
}
