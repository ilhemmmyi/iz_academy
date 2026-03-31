import { useState, useEffect } from 'react';
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
import { enrollmentsApi } from '../../api/enrollments.api';
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

  const handleEnrollment = async () => {
    if (!user) {
      setShowLoginDialog(true);
      return;
    }
    try {
      await enrollmentsApi.request(id!);
      setEnrollmentStatus('PENDING');
    } catch {
      alert("Erreur lors de la demande d'inscription.");
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

                  {enrollmentStatus === 'APPROVED' ? (
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
