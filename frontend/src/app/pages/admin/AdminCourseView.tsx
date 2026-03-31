import { AdminLayout } from '../../components/AdminLayout';
import { useParams, Link, useNavigate } from 'react-router';
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
  Edit,
  Globe,
  EyeOff,
  FolderKanban,
  Users,
  Tag,
  DollarSign,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { coursesApi } from '../../../api/courses.api';
import { lessonsApi } from '../../../api/lessons.api';
import { resourcesApi, CourseResource } from '../../../api/resources.api';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';

export function AdminCourseView() {
  const { id: courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);

  // Resources
  const [resources, setResources] = useState<CourseResource[]>([]);
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceFile, setResourceFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active tab
  const [activeTab, setActiveTab] = useState<'info' | 'resources'>('info');

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
      resourcesApi.getResources(courseId).catch(() => [] as CourseResource[]),
    ]).then(([c, res]) => {
      setCourse(c);
      setResources(res);
      const firstLesson = c?.modules?.[0]?.lessons?.[0];
      if (firstLesson) {
        setSelectedLesson(firstLesson);
        loadVideo(firstLesson);
      }
      if (c?.modules?.[0]) setExpandedSections([c.modules[0].id]);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [courseId]);

  const handleSelectLesson = (lesson: any) => {
    setSelectedLesson(lesson);
    loadVideo(lesson);
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
      toast.error(err.message || "Erreur lors de l'ajout");
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

  const handleTogglePublish = async () => {
    if (!courseId) return;
    try {
      const { isPublished } = await coursesApi.togglePublish(courseId);
      setCourse((prev: any) => ({ ...prev, isPublished }));
      toast.success(isPublished ? 'Cours publié' : 'Cours repassé en brouillon');
    } catch {
      toast.error('Erreur lors de la publication');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="max-w-7xl mx-auto">
          <div className="bg-white border border-border rounded-xl p-12 text-center text-muted-foreground">
            Chargement du cours...
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!course) {
    return (
      <AdminLayout>
        <div className="max-w-7xl mx-auto">
          <div className="bg-white border border-border rounded-xl p-12 text-center">
            <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Cours introuvable</h2>
            <Link to="/admin/courses" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition">
              Retour aux cours
            </Link>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const allLessons: any[] = (course.modules || []).flatMap((m: any) => m.lessons || []);

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin/courses" className="text-sm text-muted-foreground hover:text-primary transition flex items-center gap-1">
              ← Gestion des cours
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTogglePublish}
              className={course.isPublished ? 'text-amber-600 border-amber-200 hover:bg-amber-50' : 'text-teal-600 border-teal-200 hover:bg-teal-50'}
            >
              {course.isPublished ? <><EyeOff className="w-4 h-4 mr-2" />Dépublier</> : <><Globe className="w-4 h-4 mr-2" />Publier</>}
            </Button>
            <Button size="sm" onClick={() => navigate(`/admin/courses/${courseId}/edit`)}>
              <Edit className="w-4 h-4 mr-2" />
              Modifier
            </Button>
          </div>
        </div>

        {/* Course header card */}
        <div className="bg-white border border-indigo-100 border-l-4 border-l-indigo-400 rounded-xl p-6 shadow-sm">
          <div className="flex items-start gap-6">
            {course.thumbnailUrl ? (
              <img src={course.thumbnailUrl} alt={course.title} className="w-32 h-20 object-cover rounded-lg flex-shrink-0" />
            ) : (
              <div className="w-32 h-20 bg-accent rounded-lg flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="mb-1">{course.title}</h1>
                  <p className="text-muted-foreground text-sm mb-3">{course.shortDescription}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border flex-shrink-0 ${
                  course.isPublished ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {course.isPublished ? 'Publié' : 'Brouillon'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {course.teacher && (
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {course.teacher.name}
                  </span>
                )}
                {course.category && (
                  <span className="flex items-center gap-1">
                    <Tag className="w-4 h-4" />
                    {course.category.name}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  {allLessons.length} leçon{allLessons.length !== 1 ? 's' : ''}
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  {course.price ? `${course.price} DT` : 'Gratuit'}
                </span>
                <span className="px-2 py-0.5 bg-violet-50 text-violet-700 border border-violet-200 rounded-full text-xs">{course.level}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* ── Left: Video + tabs ── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video player */}
            <div className="bg-white border border-indigo-100 border-l-4 border-l-indigo-400 rounded-xl overflow-hidden shadow-sm">
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
                <div className="p-4 border-t border-indigo-100">
                  <h2 className="text-base font-semibold mb-1">{selectedLesson.title}</h2>
                  {selectedLesson.description && (
                    <p className="text-sm text-muted-foreground mt-1">{selectedLesson.description}</p>
                  )}
                  {selectedLesson.duration && (
                    <span className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                      <Video className="w-4 h-4" /> {selectedLesson.duration}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Tabs: Info | Ressources */}
            <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">
              <div className="flex border-b border-border">
                {(['info', 'resources'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-3 text-sm font-medium transition border-b-2 -mb-px ${
                      activeTab === tab
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tab === 'info' ? 'Détails du cours' : `Ressources (${resources.length})`}
                  </button>
                ))}
              </div>

              {/* Info tab */}
              {activeTab === 'info' && (
                <div className="p-6 space-y-4">
                  {course.longDescription && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Description détaillée</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">{course.longDescription}</p>
                    </div>
                  )}
                  {course.objectives?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Objectifs d'apprentissage</h4>
                      <ul className="space-y-1">
                        {course.objectives.map((obj: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <span className="text-teal-500 font-bold mt-0.5">✓</span>
                            {obj}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {course.projects?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <FolderKanban className="w-4 h-4 text-violet-600" />
                        Projets ({course.projects.length})
                      </h4>
                      <div className="space-y-2">
                        {course.projects.map((p: any) => (
                          <div key={p.id} className="p-3 border border-violet-100 border-l-4 border-l-violet-400 rounded-lg bg-violet-50/30 text-sm">
                            <p className="font-medium">{p.title}</p>
                            {p.description && <p className="text-muted-foreground mt-1">{p.description}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Resources tab */}
              {activeTab === 'resources' && (
                <div className="p-6 space-y-4">
                  {/* Upload form */}
                  <div className="border border-indigo-100 rounded-lg p-4 space-y-3 bg-indigo-50/30">
                    <h4 className="font-medium text-sm">Ajouter une ressource</h4>
                    <div className="grid md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label>Titre</Label>
                        <Input
                          value={resourceTitle}
                          onChange={e => setResourceTitle(e.target.value)}
                          placeholder="Nom de la ressource"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Fichier</Label>
                        <div className="flex items-center gap-2">
                          <label className="flex-1 cursor-pointer flex items-center gap-2 px-3 py-2 border border-border rounded-lg hover:bg-accent transition text-sm">
                            <Paperclip className="w-4 h-4 text-muted-foreground" />
                            <span className="truncate text-muted-foreground text-xs">
                              {resourceFile ? resourceFile.name : 'Choisir un fichier'}
                            </span>
                            <input
                              ref={fileInputRef}
                              type="file"
                              className="hidden"
                              onChange={e => setResourceFile(e.target.files?.[0] || null)}
                            />
                          </label>
                          {resourceFile && (
                            <button
                              type="button"
                              onClick={() => { setResourceFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                              className="p-1.5 hover:bg-accent rounded transition"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddResource}
                      disabled={!resourceTitle.trim() || !resourceFile || uploading}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      {uploading ? 'Upload...' : 'Ajouter'}
                    </Button>
                  </div>

                  {/* Resource list */}
                  {resources.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Aucune ressource pour ce cours.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {resources.map(r => (
                        <div key={r.id} className="flex items-center gap-3 p-3 bg-white border border-indigo-100 border-l-4 border-l-indigo-400 rounded-xl shadow-sm">
                          <div className="p-2 bg-indigo-50 rounded-lg flex-shrink-0">
                            <FileText className="w-4 h-4 text-indigo-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{r.title}</p>
                            <p className="text-xs text-muted-foreground">{r.fileType} • {new Date(r.createdAt).toLocaleDateString('fr-FR')}</p>
                          </div>
                          <a
                            href={r.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-accent rounded-lg transition text-muted-foreground"
                            title="Télécharger"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                          <button
                            type="button"
                            onClick={() => handleDeleteResource(r.id)}
                            className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Right Sidebar: Course structure ── */}
          <div className="space-y-6">
            <div className="bg-white border border-indigo-100 border-l-4 border-l-indigo-400 rounded-xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-indigo-100 bg-indigo-50/40">
                <h3>Contenu du cours</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{allLessons.length} leçon{allLessons.length !== 1 ? 's' : ''} • {(course.modules || []).length} section{(course.modules || []).length !== 1 ? 's' : ''}</p>
              </div>
              <div className="max-h-[600px] overflow-y-auto">
                {(course.modules || []).map((module: any) => (
                  <div key={module.id} className="border-b border-border last:border-b-0">
                    <button
                      onClick={() => toggleSection(module.id)}
                      className="w-full p-4 flex items-center justify-between hover:bg-accent transition text-left"
                    >
                      <span className="font-medium text-sm">{module.title}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{(module.lessons || []).length} leçon{(module.lessons || []).length !== 1 ? 's' : ''}</span>
                        {expandedSections.includes(module.id) ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </button>

                    {expandedSections.includes(module.id) && (
                      <div className="bg-accent/20">
                        {(module.lessons || []).map((lesson: any) => {
                          const active = selectedLesson?.id === lesson.id;
                          return (
                            <button
                              key={lesson.id}
                              onClick={() => handleSelectLesson(lesson)}
                              className={`w-full p-4 flex items-center gap-3 hover:bg-accent transition text-left ${active ? 'bg-accent border-l-2 border-l-indigo-400' : ''}`}
                            >
                              <div className={`p-1.5 rounded-md flex-shrink-0 ${active ? 'bg-indigo-100' : 'bg-muted'}`}>
                                <Video className={`w-3.5 h-3.5 ${active ? 'text-indigo-600' : 'text-muted-foreground'}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate ${active ? 'text-indigo-700' : ''}`}>{lesson.title}</p>
                                {lesson.duration && (
                                  <p className="text-xs text-muted-foreground">{lesson.duration}</p>
                                )}
                              </div>
                              {lesson.quiz && (
                                <span className="text-xs px-1.5 py-0.5 bg-violet-100 text-violet-700 rounded-full flex-shrink-0">Quiz</span>
                              )}
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
      </div>
    </AdminLayout>
  );
}
