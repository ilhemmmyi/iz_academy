import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useParams, Link, useNavigate } from 'react-router';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { 
  Clock, 
  Award, 
  CheckCircle, 
  BookOpen,
  Play,
  XCircle,
  Hourglass,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { coursesApi } from '../../api/courses.api';
import { enrollmentsApi, EnrollmentExtraInfo } from '../../api/enrollments.api';
import { useAuth } from '../../context/AuthContext';

type EnrollmentStatus = 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';

export function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [enrollmentStatus, setEnrollmentStatus] = useState<EnrollmentStatus>('NONE');
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showEnrollPopup, setShowEnrollPopup] = useState(false);
  const [enrollForm, setEnrollForm] = useState<EnrollmentExtraInfo>({
    phone: '', address: '', educationLevel: '', studentStatus: '',
  });
  const [enrollFormErrors, setEnrollFormErrors] = useState<Partial<EnrollmentExtraInfo>>({});
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    if (!id) return;
    coursesApi.getById(id)
      .then(data => setCourse(data))
      .catch(() => setCourse(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id || !user) return;
    enrollmentsApi.getMine()
      .then((enrollments: any[]) => {
        const found = enrollments.find((e: any) => e.courseId === id);
        setEnrollmentStatus(found ? (found.status as EnrollmentStatus) : 'NONE');
      })
      .catch(() => {});
  }, [id, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-muted-foreground">Chargement...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl mb-4">Cours non trouvé</h2>
            <Link to="/courses">
              <Button>Retour aux cours</Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const handleEnrollment = () => {
    if (!user) {
      setShowLoginDialog(true);
      return;
    }
    setEnrollForm({ phone: '', address: '', educationLevel: '', studentStatus: '' });
    setEnrollFormErrors({});
    setShowEnrollPopup(true);
  };

  const handleEnrollSubmit = async () => {
    // Validate
    const errors: Partial<EnrollmentExtraInfo> = {};
    if (!enrollForm.phone.trim()) errors.phone = 'Champ obligatoire';
    if (!enrollForm.address.trim()) errors.address = 'Champ obligatoire';
    if (!enrollForm.educationLevel.trim()) errors.educationLevel = 'Champ obligatoire';
    if (!enrollForm.studentStatus.trim()) errors.studentStatus = 'Champ obligatoire';
    if (Object.keys(errors).length > 0) { setEnrollFormErrors(errors); return; }

    setEnrolling(true);
    try {
      await enrollmentsApi.request(id!, undefined, enrollForm);
      setEnrollmentStatus('PENDING');
      setShowEnrollPopup(false);
      toast.success(
        'Demande envoyée ! Veuillez contacter notre équipe pour compléter le processus de paiement.',
        { duration: 6000 },
      );
    } catch {
      toast.error("Erreur lors de la demande d'inscription.");
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary via-primary to-[#1a1a2e] text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="secondary" className="bg-white/20 text-white border-0">
                  {course.category?.name}
                </Badge>
                <Badge variant="outline" className="border-white/40 text-white">
                  {course.level}
                </Badge>
              </div>
              <h1 className="text-3xl md:text-4xl mb-4">{course.title}</h1>
              <p className="text-xl text-primary-foreground/90 mb-6">
                {course.shortDescription}
              </p>
              <div className="flex flex-wrap items-center gap-6 mb-6">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span>{course.duration}</span>
                </div>
              </div>
              <div className="text-sm text-primary-foreground/80">
                Formateur: {course.teacher?.name}
              </div>
            </div>
            <div className="aspect-video bg-muted rounded-xl overflow-hidden">
              <img
                src={course.thumbnailUrl}
                alt={course.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
                  <TabsTrigger value="curriculum">Programme</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  <Card>
                    <CardContent className="pt-6">
                      <h2 className="text-2xl mb-4">À propos de ce cours</h2>
                      <p className="text-muted-foreground mb-6">
                        {course.longDescription}
                      </p>

                      {course.objectives?.length > 0 && (
                        <>
                          <h3 className="text-xl mb-4">Objectifs d'apprentissage</h3>
                          <ul className="space-y-3">
                            {course.objectives.map((objective: string, index: number) => (
                              <li key={index} className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                <span>{objective}</span>
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="curriculum" className="space-y-4">
                  {course.modules?.map((module: any, moduleIndex: number) => (
                    <Card key={module.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-3 mb-4">
                          <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center flex-shrink-0">
                            {moduleIndex + 1}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl mb-2">{module.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {module.lessons?.length || 0} leçons
                            </p>
                          </div>
                        </div>
                        <ul className="space-y-2 ml-11">
                          {module.lessons?.map((lesson: any, lessonIndex: number) => (
                            <li key={lesson.id || lessonIndex} className="flex items-center gap-3 py-2">
                              <Play className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground">{lesson.title}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  ))}
                  {(!course.modules || course.modules.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">Aucun module disponible.</div>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardContent className="pt-6">
                  <div className="text-center mb-6">
                    <div className="text-4xl font-bold text-primary mb-2">
                      {course.price ? `${course.price}DT` : 'Gratuit'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Paiement unique
                    </div>
                  </div>

                  {user && user.role !== 'STUDENT' ? (
                    <div className="text-center text-sm text-muted-foreground py-2">
                      Les formateurs et administrateurs ne peuvent pas s'inscrire aux formations.
                    </div>
                  ) : enrollmentStatus === 'APPROVED' ? (
                    <Button className="w-full" onClick={() => navigate(`/student/course/${id}`)}>
                      <Play className="w-5 h-5 mr-2" />
                      Accéder au cours
                    </Button>
                  ) : enrollmentStatus === 'PENDING' ? (
                    <Button className="w-full" disabled variant="outline">
                      <Hourglass className="w-5 h-5 mr-2" />
                      En attente d'approbation
                    </Button>
                  ) : enrollmentStatus === 'REJECTED' ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 justify-center text-destructive text-sm">
                        <XCircle className="w-4 h-4" />
                        Demande refusée
                      </div>
                      <Button className="w-full" onClick={handleEnrollment}>
                        Renvoyer une demande
                      </Button>
                    </div>
                  ) : (
                    <Button className="w-full" onClick={handleEnrollment}>
                      Demander à s'inscrire à la formation
                    </Button>
                  )}

                  <div className="mt-6 pt-6 border-t border-border space-y-4">
                    <h3 className="font-semibold mb-3">Ce cours inclut :</h3>
                    <div className="flex items-center gap-3 text-sm">
                      <BookOpen className="w-5 h-5 text-muted-foreground" />
                      <span>{course.modules?.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0) || 0} leçons</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Clock className="w-5 h-5 text-muted-foreground" />
                      <span>{course.duration}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Award className="w-5 h-5 text-muted-foreground" />
                      <span>Certificat à l'issue</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Enrollment Extra Info Popup */}
      {showEnrollPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-background rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-xl font-semibold">Informations complémentaires</h2>
            <p className="text-sm text-muted-foreground">
              Remplissez ces informations pour compléter votre demande d'inscription.
            </p>

            {/* Téléphone */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Numéro de téléphone <span className="text-destructive">*</span></label>
              <input
                type="tel"
                placeholder="Ex : 55 123 456"
                value={enrollForm.phone}
                onChange={e => { setEnrollForm(f => ({ ...f, phone: e.target.value })); setEnrollFormErrors(er => ({ ...er, phone: '' })); }}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {enrollFormErrors.phone && <p className="text-xs text-destructive">{enrollFormErrors.phone}</p>}
            </div>

            {/* Adresse */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Adresse <span className="text-destructive">*</span></label>
              <input
                type="text"
                placeholder="Ex : 12 Rue des Fleurs, Tunis"
                value={enrollForm.address}
                onChange={e => { setEnrollForm(f => ({ ...f, address: e.target.value })); setEnrollFormErrors(er => ({ ...er, address: '' })); }}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {enrollFormErrors.address && <p className="text-xs text-destructive">{enrollFormErrors.address}</p>}
            </div>

            {/* Niveau scolaire */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Niveau scolaire <span className="text-destructive">*</span></label>
              <select
                value={enrollForm.educationLevel}
                onChange={e => { setEnrollForm(f => ({ ...f, educationLevel: e.target.value })); setEnrollFormErrors(er => ({ ...er, educationLevel: '' })); }}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Sélectionner...</option>
                <option value="Bac">Bac</option>
                <option value="Bac+2">Bac+2</option>
                <option value="Bac+3">Bac+3</option>
                <option value="Bac+4">Bac+4</option>
                <option value="Bac+5 et plus">Bac+5 et plus</option>
                <option value="Autre">Autre</option>
              </select>
              {enrollFormErrors.educationLevel && <p className="text-xs text-destructive">{enrollFormErrors.educationLevel}</p>}
            </div>

            {/* Statut */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Statut <span className="text-destructive">*</span></label>
              <select
                value={enrollForm.studentStatus}
                onChange={e => { setEnrollForm(f => ({ ...f, studentStatus: e.target.value })); setEnrollFormErrors(er => ({ ...er, studentStatus: '' })); }}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Sélectionner...</option>
                <option value="Étudiant">Étudiant</option>
                <option value="Employé">Employé</option>
                <option value="Autre">Autre</option>
              </select>
              {enrollFormErrors.studentStatus && <p className="text-xs text-destructive">{enrollFormErrors.studentStatus}</p>}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowEnrollPopup(false)}
                className="flex-1 border border-input rounded-lg px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleEnrollSubmit}
                disabled={enrolling}
                className="flex-1 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {enrolling ? 'Envoi...' : 'Valider'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Login Dialog */}
      <AlertDialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Connexion requise</AlertDialogTitle>
            <AlertDialogDescription>
              Vous devez vous connecter ou vous inscrire pour demander l'accès à cette formation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate('/login')}>
              Se connecter
            </AlertDialogAction>
            <AlertDialogAction onClick={() => navigate('/register')}>
              S'inscrire
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
}
