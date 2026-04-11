import { TeacherLayout } from '../../components/TeacherLayout';
import { useParams, Link } from 'react-router';
import {
  Play,
  ChevronDown,
  ChevronUp,
  Video,
  FileText,
  Download,
  Paperclip,
  Trash2,
  X,
  BookOpen,
  ExternalLink,
  FolderKanban,
  ArrowLeft,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { coursesApi } from '../../../api/courses.api';
import { lessonsApi } from '../../../api/lessons.api';
import { resourcesApi, CourseResource } from '../../../api/resources.api';
import { lessonResourcesApi, LessonResource as LessonRes } from '../../../api/lessonResources.api';
import { LessonComments } from '../../components/LessonComments';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';

export function TeacherCourseView() {
  const { courseId } = useParams();

  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);

  // Resources
  const [resources, setResources] = useState<CourseResource[]>([]);
  const [lessonResources, setLessonResources] = useState<LessonRes[]>([]);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceFile, setResourceFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active tab: 'comments' | 'resources' | 'projects'
  const [activeTab, setActiveTab] = useState<'comments' | 'resources' | 'projects'>('comments');

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
    Promise.all([
      coursesApi.getById(courseId),
      resourcesApi.getResources(courseId).catch(() => []),
    ]).then(([c, res]) => {
      setCourse(c);
      setResources(res);
      const firstLesson = c?.modules?.[0]?.lessons?.[0];
      if (firstLesson) {
        setSelectedLesson(firstLesson);
        loadVideo(firstLesson);
        lessonResourcesApi.getResources(firstLesson.id).then(setLessonResources).catch(() => setLessonResources([]));
      }
      if (c?.modules?.[0]) setExpandedSections([c.modules[0].id]);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [courseId]);

  // Lazy-load project catalog when that tab is opened
  useEffect(() => {
    if (activeTab !== 'projects' || !courseId || projects.length > 0) return;
    setProjectsLoading(true);
    import('../../../api/projects.api').then(({ projectsApi }) =>
      projectsApi.getByCourse(courseId)
    ).then((data: any[]) => setProjects(data))
    .catch(() => {})
    .finally(() => setProjectsLoading(false));
  }, [activeTab, courseId]);

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

  const handleAddResource = async () => {
    if (!courseId || !resourceTitle.trim() || !resourceFile || uploading) return;
    setUploading(true);
    try {
      const created = await resourcesApi.uploadResource(courseId, resourceTitle.trim(), resourceFile);
      setResources(prev => [created, ...prev]);
      setResourceTitle('');
      setResourceFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      toast.success('Ressource ajoutée');
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de l\'ajout');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteResource = async (id: string) => {
    try {
      await resourcesApi.deleteResource(id);
      setResources(prev => prev.filter(r => r.id !== id));
      toast.success('Ressource supprimée');
    } catch {
      toast.error('Erreur lors de la suppression');
    }
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
          <Link to="/teacher/courses" className="text-primary hover:underline mb-2 inline-block">
            ← Retour à mes cours
          </Link>
          <h1 className="mb-1">{course.title}</h1>
          <p className="text-muted-foreground text-sm">{allLessons.length} leçon{allLessons.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* ── Left: Video + tabs ── */}
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
                  {lessonResources.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ressources de la leçon</p>
                      {lessonResources.map(r => (
                        <a
                          key={r.id}
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-2 rounded-lg border border-border hover:bg-accent transition text-sm"
                        >
                          <div className="p-1 bg-primary/10 rounded flex-shrink-0">
                            {r.type === 'LINK'
                              ? <ExternalLink className="w-3.5 h-3.5 text-primary" />
                              : <FileText className="w-3.5 h-3.5 text-primary" />}
                          </div>
                          <span className="flex-1 truncate font-medium">{r.title}</span>
                          {r.type === 'FILE' && <Download className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Tabs: Commentaires | Ressources | Projets */}
            <div className="bg-white border border-border rounded-xl overflow-hidden">
              <div className="flex border-b border-border">
                {(['comments', 'resources', 'projects'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => { setActiveTab(tab); setSelectedProject(null); }}
                    className={`flex-1 py-3 text-sm font-medium transition border-b-2 -mb-px ${
                      activeTab === tab
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tab === 'comments' ? 'Commentaires' : tab === 'resources' ? 'Ressources' : 'Projets'}
                  </button>
                ))}
              </div>

              {/* Comments tab */}
              {activeTab === 'comments' && selectedLesson && (
                <div className="p-4">
                  <LessonComments lessonId={selectedLesson.id} />
                </div>
              )}
              {activeTab === 'comments' && !selectedLesson && (
                <p className="p-6 text-muted-foreground text-sm text-center">Sélectionnez une leçon pour voir les commentaires.</p>
              )}

              {/* Resources tab */}
              {activeTab === 'resources' && (
                <div className="p-4 space-y-4">
                  {/* Add resource form */}
                  <div className="border border-border rounded-lg p-4 space-y-3 bg-accent/30">
                    <h4 className="font-medium text-sm">Ajouter une ressource</h4>
                    <div className="grid gap-3">
                      <div>
                        <Label htmlFor="res-title">Titre</Label>
                        <Input
                          id="res-title"
                          value={resourceTitle}
                          onChange={e => setResourceTitle(e.target.value)}
                          placeholder="Nom de la ressource"
                        />
                      </div>
                      <div>
                        <Label htmlFor="res-file">Fichier</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            ref={fileInputRef}
                            id="res-file"
                            type="file"
                            className="hidden"
                            onChange={e => setResourceFile(e.target.files?.[0] || null)}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2"
                          >
                            <Paperclip className="w-4 h-4" />
                            Choisir un fichier
                          </Button>
                          {resourceFile && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <span className="truncate max-w-[160px]">{resourceFile.name}</span>
                              <button onClick={() => { setResourceFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}>
                                <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        onClick={handleAddResource}
                        disabled={!resourceTitle.trim() || !resourceFile || uploading}
                        size="sm"
                      >
                        {uploading ? 'Envoi…' : 'Ajouter'}
                      </Button>
                    </div>
                  </div>

                  {/* Existing resources */}
                  {resources.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Aucune ressource pour ce cours.</p>
                  ) : (
                    <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
                      {resources.map(r => (
                        <div key={r.id} className="flex items-center gap-3 p-3">
                          <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                            <FileText className="w-4 h-4 text-primary" />
                          </div>
                          <span className="flex-1 text-sm font-medium truncate">{r.title}</span>
                          <a href={r.fileUrl} target="_blank" rel="noopener noreferrer">
                            <Download className="w-4 h-4 text-muted-foreground hover:text-primary" />
                          </a>
                          <button onClick={() => handleDeleteResource(r.id)}>
                            <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Projects tab */}
              {activeTab === 'projects' && (
                <div className="p-4">
                  {projectsLoading ? (
                    <p className="text-sm text-muted-foreground text-center py-6">Chargement\u2026</p>
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
              )}

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
