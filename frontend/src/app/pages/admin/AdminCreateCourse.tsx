import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { useNavigate } from 'react-router';
import {
  PlusCircle, Trash2, ArrowLeft, ChevronDown, ChevronUp,
  BookOpen, ListChecks, FolderKanban, CheckCircle2, ImageIcon, Video,
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from 'sonner';
import { coursesApi } from '../../../api/courses.api';
import { uploadApi } from '../../../api/upload.api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface QuizQuestion {
  id: string;
  text: string;
  answers: [string, string, string, string];
  correctAnswer: number;
}
interface LessonForm {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  hasQuiz: boolean;
  quizOpen: boolean;
  questions: QuizQuestion[];
}
interface SectionForm {
  id: string;
  title: string;
  lessons: LessonForm[];
}
interface ProjectForm {
  id: string;
  title: string;
  description: string;
  instructions: string;
}

const newQuestion = (): QuizQuestion => ({
  id: Date.now().toString() + Math.random(),
  text: '',
  answers: ['', '', '', ''],
  correctAnswer: 0,
});
const newLesson = (): LessonForm => ({
  id: Date.now().toString() + Math.random(),
  title: '',
  description: '',
  videoUrl: '',
  hasQuiz: false,
  quizOpen: false,
  questions: [newQuestion()],
});
const newSection = (): SectionForm => ({
  id: Date.now().toString() + Math.random(),
  title: '',
  lessons: [newLesson()],
});
const newProject = (): ProjectForm => ({
  id: Date.now().toString() + Math.random(),
  title: '',
  description: '',
  instructions: '',
});

// ─── Step indicator ───────────────────────────────────────────────────────────
const STEPS = [
  { label: 'Infos', icon: BookOpen },
  { label: 'Contenu', icon: ListChecks },
  { label: 'Projets', icon: FolderKanban },
  { label: 'Révision', icon: CheckCircle2 },
];

export function AdminCreateCourse() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Step 1 – Basic info
  const [title, setTitle] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [longDesc, setLongDesc] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [level, setLevel] = useState('');
  const [duration, setDuration] = useState('');
  const [price, setPrice] = useState('');
  const [objectives, setObjectives] = useState(['']);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [thumbnailUploading, setThumbnailUploading] = useState(false);

  // Step 2 – Sections + lessons
  const [sections, setSections] = useState<SectionForm[]>([newSection()]);
  const [uploadingVideo, setUploadingVideo] = useState<string | null>(null);

  // Step 3 – Projects
  const [projects, setProjects] = useState<ProjectForm[]>([newProject()]);

  useEffect(() => {
    coursesApi.getCategories().then(setCategories).catch(() => {});
  }, []);

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbnailUploading(true);
    try {
      const { url } = await uploadApi.uploadThumbnail(file);
      setThumbnailUrl(url);
      toast.success('Image uploadée');
    } catch {
      toast.error("Échec de l'upload");
    } finally {
      setThumbnailUploading(false);
    }
  };

  // ── Objectives helpers ────────────────────────────────────────────────────
  const addObjective = () => setObjectives([...objectives, '']);
  const updateObjective = (i: number, v: string) =>
    setObjectives(objectives.map((o, idx) => (idx === i ? v : o)));
  const removeObjective = (i: number) =>
    setObjectives(objectives.filter((_, idx) => idx !== i));

  // ── Section helpers ───────────────────────────────────────────────────────
  const addSection = () => setSections([...sections, newSection()]);
  const removeSection = (sid: string) =>
    setSections(sections.filter(s => s.id !== sid));
  const updateSectionTitle = (sid: string, v: string) =>
    setSections(sections.map(s => (s.id === sid ? { ...s, title: v } : s)));

  // ── Lesson helpers ────────────────────────────────────────────────────────
  const addLesson = (sid: string) =>
    setSections(prev => prev.map(s => s.id === sid ? { ...s, lessons: [...s.lessons, newLesson()] } : s));
  const removeLesson = (sid: string, lid: string) =>
    setSections(prev => prev.map(s => s.id === sid ? { ...s, lessons: s.lessons.filter(l => l.id !== lid) } : s));
  const updateLesson = (sid: string, lid: string, patch: Partial<LessonForm>) =>
    setSections(prev => prev.map(s =>
      s.id === sid ? { ...s, lessons: s.lessons.map(l => l.id === lid ? { ...l, ...patch } : l) } : s
    ));

  // ── Video upload helper ───────────────────────────────────────────────────
  const handleVideoUpload = async (sectionId: string, lessonId: string, file: File) => {
    const key = `${sectionId}-${lessonId}`;
    setUploadingVideo(key);
    try {
      const { url } = await uploadApi.uploadVideo(file);
      updateLesson(sectionId, lessonId, { videoUrl: url });
      toast.success('Vidéo uploadée avec succès');
    } catch {
      toast.error("Échec de l'upload vidéo");
    } finally {
      setUploadingVideo(null);
    }
  };

  // ── Question helpers ──────────────────────────────────────────────────────
  const addQuestion = (sid: string, lid: string) =>
    setSections(sections.map(s =>
      s.id === sid ? {
        ...s, lessons: s.lessons.map(l =>
          l.id === lid ? { ...l, questions: [...l.questions, newQuestion()] } : l
        )
      } : s
    ));
  const removeQuestion = (sid: string, lid: string, qid: string) =>
    setSections(sections.map(s =>
      s.id === sid ? {
        ...s, lessons: s.lessons.map(l =>
          l.id === lid ? { ...l, questions: l.questions.filter(q => q.id !== qid) } : l
        )
      } : s
    ));
  const updateQuestion = (sid: string, lid: string, qid: string, patch: Partial<QuizQuestion>) =>
    setSections(sections.map(s =>
      s.id === sid ? {
        ...s, lessons: s.lessons.map(l =>
          l.id === lid ? {
            ...l, questions: l.questions.map(q => q.id === qid ? { ...q, ...patch } : q)
          } : l
        )
      } : s
    ));
  const updateAnswer = (sid: string, lid: string, qid: string, ai: number, v: string) =>
    setSections(sections.map(s =>
      s.id === sid ? {
        ...s, lessons: s.lessons.map(l =>
          l.id === lid ? {
            ...l, questions: l.questions.map(q => {
              if (q.id !== qid) return q;
              const answers = [...q.answers] as [string, string, string, string];
              answers[ai] = v;
              return { ...q, answers };
            })
          } : l
        )
      } : s
    ));

  // ── Project helpers ───────────────────────────────────────────────────────
  const addProject = () => setProjects([...projects, newProject()]);
  const removeProject = (pid: string) => setProjects(projects.filter(p => p.id !== pid));
  const updateProject = (pid: string, patch: Partial<ProjectForm>) =>
    setProjects(projects.map(p => p.id === pid ? { ...p, ...patch } : p));

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!title || !categoryId || !level) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    setSubmitting(true);
    try {
      await coursesApi.create({
        title,
        shortDescription: shortDesc,
        longDescription: longDesc,
        categoryId,
        level,
        duration,
        price: parseFloat(price) || 0,
        objectives: objectives.filter(o => o.trim()),
        thumbnailUrl: thumbnailUrl || null,
        isPublished: true,
        modules: sections.map(s => ({
          title: s.title,
          lessons: s.lessons.map(l => ({
            title: l.title,
            description: l.description || undefined,
            videoUrl: l.videoUrl || undefined,
            ...(l.hasQuiz && l.questions.some(q => q.text.trim()) ? {
              quiz: {
                questions: l.questions
                  .filter(q => q.text.trim())
                  .map(q => ({ text: q.text, answers: q.answers, correctAnswer: q.correctAnswer })),
              },
            } : {}),
          })),
        })),
        projects: projects
          .filter(p => p.title.trim())
          .map(p => ({ title: p.title, description: p.description, instructions: p.instructions })),
      });
      toast.success('Cours créé avec succès !');
      navigate('/admin/courses');
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la création');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── UI helpers ───────────────────────────────────────────────────────────
  const canGoNext = () => {
    if (step === 1) return !!(title && categoryId && level);
    if (step === 2) return sections.every(s => s.title.trim() && s.lessons.every(l => l.title.trim()));
    return true;
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/admin/courses')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="mb-1">Créer un nouveau cours</h1>
            <p className="text-muted-foreground text-sm">Remplissez les informations étape par étape</p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const active = step === i + 1;
            const done = step > i + 1;
            return (
              <div key={i} className="flex items-center gap-2 flex-1">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition flex-1 ${active ? 'bg-primary text-primary-foreground' : done ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
                {i < STEPS.length - 1 && <div className="w-4 h-0.5 bg-border flex-shrink-0" />}
              </div>
            );
          })}
        </div>

        {/* ── Step 1: Basic Info ─────────────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <h2 className="text-xl font-semibold">Informations générales</h2>

                {/* Thumbnail */}
                <div className="space-y-2">
                  <Label>Image du cours</Label>
                  <div className="flex items-center gap-4">
                    {thumbnailUrl ? (
                      <img src={thumbnailUrl} alt="thumbnail" className="w-32 h-20 object-cover rounded-lg border border-border" />
                    ) : (
                      <div className="w-32 h-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted">
                        <ImageIcon className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    <label className="cursor-pointer flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-accent transition text-sm">
                      <ImageIcon className="w-4 h-4" />
                      {thumbnailUploading ? 'Upload...' : thumbnailUrl ? "Changer l'image" : 'Uploader une image'}
                      <input type="file" accept="image/*" className="hidden" onChange={handleThumbnailUpload} disabled={thumbnailUploading} />
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Titre du cours *</Label>
                  <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Développement Web Full Stack" />
                </div>
                <div className="space-y-2">
                  <Label>Description courte *</Label>
                  <Input value={shortDesc} onChange={e => setShortDesc(e.target.value)} placeholder="Résumé affiché sur la carte du cours" />
                </div>
                <div className="space-y-2">
                  <Label>Description détaillée</Label>
                  <Textarea value={longDesc} onChange={e => setLongDesc(e.target.value)} placeholder="Décrivez le contenu et les prérequis" rows={4} />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Catégorie *</Label>
                    <Select value={categoryId} onValueChange={setCategoryId}>
                      <SelectTrigger><SelectValue placeholder="Sélectionner une catégorie" /></SelectTrigger>
                      <SelectContent>
                        {categories.length === 0 && <SelectItem value="_none" disabled>Aucune catégorie disponible</SelectItem>}
                        {categories.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Niveau *</Label>
                    <Select value={level} onValueChange={setLevel}>
                      <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Débutant">Débutant</SelectItem>
                        <SelectItem value="Intermédiaire">Intermédiaire</SelectItem>
                        <SelectItem value="Avancé">Avancé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Durée estimée</Label>
                    <Input value={duration} onChange={e => setDuration(e.target.value)} placeholder="Ex: 12 semaines" />
                  </div>
                  <div className="space-y-2">
                    <Label>Prix (DT)</Label>
                    <Input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0 = Gratuit" min="0" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Objectifs d'apprentissage</h2>
                  <Button type="button" variant="outline" size="sm" onClick={addObjective}>
                    <PlusCircle className="w-4 h-4 mr-2" /> Ajouter
                  </Button>
                </div>
                {objectives.map((obj, i) => (
                  <div key={i} className="flex gap-2">
                    <Input value={obj} onChange={e => updateObjective(i, e.target.value)} placeholder={`Objectif ${i + 1}`} />
                    {objectives.length > 1 && (
                      <Button type="button" variant="outline" size="icon" onClick={() => removeObjective(i)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Step 2: Sections & Lessons ─────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Sections et leçons</h2>
              <Button type="button" variant="outline" size="sm" onClick={addSection}>
                <PlusCircle className="w-4 h-4 mr-2" /> Ajouter une section
              </Button>
            </div>

            {sections.map((section, si) => (
              <Card key={section.id} className="border-2 border-primary/20">
                <CardContent className="pt-6 space-y-4">
                  {/* Section header */}
                  <div className="flex gap-2 items-center">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {si + 1}
                    </div>
                    <Input
                      value={section.title}
                      onChange={e => updateSectionTitle(section.id, e.target.value)}
                      placeholder={`Section ${si + 1} — titre`}
                      className="font-medium"
                    />
                    {sections.length > 1 && (
                      <Button type="button" variant="outline" size="icon" onClick={() => removeSection(section.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </div>

                  {/* Lessons */}
                  <div className="ml-10 space-y-4">
                    {section.lessons.map((lesson, li) => (
                      <div key={lesson.id} className="border border-border rounded-lg p-4 bg-muted/20 space-y-3">
                        {/* Lesson row */}
                        <div className="flex gap-2 items-center">
                          <span className="text-sm text-muted-foreground w-6">{li + 1}.</span>
                          <Input
                            value={lesson.title}
                            onChange={e => updateLesson(section.id, lesson.id, { title: e.target.value })}
                            placeholder="Titre de la leçon"
                            className="flex-1"
                          />
                          {section.lessons.length > 1 && (
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeLesson(section.id, lesson.id)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                        <div className="ml-6 space-y-2">
                          <Textarea
                            value={lesson.description}
                            onChange={e => updateLesson(section.id, lesson.id, { description: e.target.value })}
                            placeholder="Description de la leçon (optionnel) — visible sous la vidéo"
                            className="text-sm"
                            rows={2}
                          />
                          <div className="flex gap-2 items-center">
                            <Input
                              value={lesson.videoUrl}
                              onChange={e => updateLesson(section.id, lesson.id, { videoUrl: e.target.value })}
                              placeholder="URL vidéo (optionnel)"
                              className="text-sm flex-1"
                            />
                            <label className="cursor-pointer flex items-center gap-2 px-3 py-2 border border-border rounded-lg hover:bg-accent transition text-sm whitespace-nowrap flex-shrink-0">
                              <Video className="w-4 h-4" />
                              {uploadingVideo === `${section.id}-${lesson.id}` ? 'Upload...' : 'Uploader'}
                              <input
                                type="file"
                                accept="video/*"
                                className="hidden"
                                disabled={uploadingVideo !== null}
                                onChange={e => e.target.files?.[0] && handleVideoUpload(section.id, lesson.id, e.target.files[0])}
                              />
                            </label>
                          </div>
                          {lesson.videoUrl && (
                            <p className="text-xs text-green-600 truncate">✓ Vidéo prête</p>
                          )}
                        </div>

                        {/* Quiz toggle */}
                        <div className="ml-6">
                          <label className="flex items-center gap-2 cursor-pointer select-none text-sm">
                            <input
                              type="checkbox"
                              checked={lesson.hasQuiz}
                              onChange={e => updateLesson(section.id, lesson.id, {
                                hasQuiz: e.target.checked,
                                quizOpen: e.target.checked,
                              })}
                              className="w-4 h-4 accent-primary"
                            />
                            <span className="font-medium">Cette leçon a un quiz (70% requis pour avancer)</span>
                          </label>
                        </div>

                        {/* Quiz questions */}
                        {lesson.hasQuiz && (
                          <div className="ml-6 bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-4">
                            <div className="flex items-center justify-between">
                              <button
                                type="button"
                                className="flex items-center gap-2 text-sm font-semibold text-primary"
                                onClick={() => updateLesson(section.id, lesson.id, { quizOpen: !lesson.quizOpen })}
                              >
                                {lesson.quizOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                Questions ({lesson.questions.length})
                              </button>
                              <Button type="button" variant="outline" size="sm" onClick={() => addQuestion(section.id, lesson.id)}>
                                <PlusCircle className="w-3 h-3 mr-1" /> Question
                              </Button>
                            </div>

                            {lesson.quizOpen && lesson.questions.map((q, qi) => (
                              <div key={q.id} className="bg-white border border-border rounded-lg p-4 space-y-3">
                                <div className="flex gap-2 items-start">
                                  <span className="text-xs font-bold text-muted-foreground pt-2 w-4">{qi + 1}</span>
                                  <Input
                                    value={q.text}
                                    onChange={e => updateQuestion(section.id, lesson.id, q.id, { text: e.target.value })}
                                    placeholder="Texte de la question"
                                    className="flex-1"
                                  />
                                  {lesson.questions.length > 1 && (
                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeQuestion(section.id, lesson.id, q.id)}>
                                      <Trash2 className="w-3 h-3 text-destructive" />
                                    </Button>
                                  )}
                                </div>
                                <div className="ml-6 space-y-2">
                                  <p className="text-xs text-muted-foreground mb-1">Réponses — cochez la bonne réponse :</p>
                                  {q.answers.map((ans, ai) => (
                                    <div key={ai} className="flex items-center gap-2">
                                      <input
                                        type="radio"
                                        name={`correct-${q.id}`}
                                        checked={q.correctAnswer === ai}
                                        onChange={() => updateQuestion(section.id, lesson.id, q.id, { correctAnswer: ai })}
                                        className="w-4 h-4 accent-green-600 flex-shrink-0"
                                      />
                                      <Input
                                        value={ans}
                                        onChange={e => updateAnswer(section.id, lesson.id, q.id, ai, e.target.value)}
                                        placeholder={`Réponse ${ai + 1}`}
                                        className="text-sm"
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}

                    <Button type="button" variant="ghost" size="sm" onClick={() => addLesson(section.id)}>
                      <PlusCircle className="w-4 h-4 mr-1" /> Ajouter une leçon
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* ── Step 3: Projects ───────────────────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Projets du cours</h2>
                <p className="text-sm text-muted-foreground mt-1">Les projets pratiques permettent aux étudiants d'appliquer leurs connaissances.</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addProject}>
                <PlusCircle className="w-4 h-4 mr-2" /> Ajouter un projet
              </Button>
            </div>

            {projects.map((p, pi) => (
              <Card key={p.id}>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex gap-2 items-center">
                    <div className="w-8 h-8 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {pi + 1}
                    </div>
                    <Input
                      value={p.title}
                      onChange={e => updateProject(p.id, { title: e.target.value })}
                      placeholder="Titre du projet"
                      className="flex-1 font-medium"
                    />
                    {projects.length > 1 && (
                      <Button type="button" variant="outline" size="icon" onClick={() => removeProject(p.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                  <Textarea
                    value={p.description}
                    onChange={e => updateProject(p.id, { description: e.target.value })}
                    placeholder="Description du projet (objectifs, compétences visées)"
                    rows={2}
                  />
                  <Textarea
                    value={p.instructions}
                    onChange={e => updateProject(p.id, { instructions: e.target.value })}
                    placeholder="Instructions détaillées (étapes à suivre, livrables attendus)"
                    rows={4}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* ── Step 4: Review ─────────────────────────────────────────────── */}
        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Récapitulatif</h2>
            <Card>
              <CardContent className="pt-6 space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Titre</span><span className="font-medium">{title}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Catégorie</span><span>{categories.find(c => c.id === categoryId)?.name || '—'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Niveau</span><span>{level}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Durée</span><span>{duration || '—'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Prix</span><span>{price ? `${price}DT` : 'Gratuit'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Sections</span><span>{sections.length}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Leçons</span><span>{sections.reduce((a, s) => a + s.lessons.length, 0)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Leçons avec quiz</span><span>{sections.reduce((a, s) => a + s.lessons.filter(l => l.hasQuiz).length, 0)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Projets</span><span>{projects.filter(p => p.title.trim()).length}</span></div>
              </CardContent>
            </Card>
            <p className="text-sm text-muted-foreground bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
              Le cours sera créé comme <strong>brouillon</strong>. Vous pourrez le publier depuis la liste des cours.
            </p>
          </div>
        )}

        {/* ── Navigation ─────────────────────────────────────────────────── */}
        <div className="flex gap-4 pt-4 border-t border-border">
          {step > 1 && (
            <Button type="button" variant="outline" onClick={() => setStep(s => s - 1)}>
              ← Précédent
            </Button>
          )}
          <div className="flex-1" />
          {step < 4 ? (
            <Button type="button" onClick={() => setStep(s => s + 1)} disabled={!canGoNext()}>
              Suivant →
            </Button>
          ) : (
            <Button type="button" onClick={handleSubmit} disabled={submitting} size="lg">
              {submitting ? 'Création...' : '✓ Créer le cours'}
            </Button>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

