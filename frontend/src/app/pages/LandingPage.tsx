import { Link } from 'react-router';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import {
  BookOpen,
  Users,
  Award,
  TrendingUp,
  ArrowRight,
  CheckCircle,
  Play,
  Clock,
  Layers,
} from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { useState, useEffect } from 'react';
import { coursesApi } from '../../api/courses.api';

export function LandingPage() {
  const [courses, setCourses] = useState<any[]>([]);

  useEffect(() => {
    coursesApi.getAll()
      .then(data => setCourses(data.slice(0, 4)))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen flex flex-col scroll-smooth">
      <Navbar />

      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-100 via-blue-100 to-pink-100" />

        <div className="relative max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Left content */}
            <div className="max-w-xl">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-primary">
                Apprenez à votre rythme avec Iz Academy
              </h1>

              <p className="text-xl text-gray-600 mb-8">
                Développez vos compétences avec nos cours en ligne de qualité.
                Formateurs experts, projets pratiques et certification garantie.
              </p>

              <div className="flex flex-wrap gap-4">
                <a
                  href="#demo"
                  className="px-8 py-3 text-white rounded-lg transition-all duration-300 hover:shadow-[0_0_30px_rgba(56,82,233,0.5)] inline-flex items-center gap-2"
                  style={{
                    backgroundImage: 'linear-gradient(90deg, #000000, #000000)',
                  }}
                >
                  Voir démonstration
                  <ArrowRight className="w-5 h-5" />
                </a>

                <Link
                  to="/courses"
                  className="px-8 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 transition-all duration-300 hover:shadow-[0_0_25px_rgba(105,63,203,0.3)]"
                >
                  Découvrir les cours
                </Link>
              </div>
            </div>

            {/* Right stats card */}
            <div className="hidden md:flex justify-end">
              <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-8 border border-gray-200 shadow-lg w-full max-w-md transition-all duration-300 hover:shadow-[0_0_40px_rgba(223,98,160,0.4)]">
                <div className="grid grid-cols-2 gap-6 text-center">
                  <div>
                    <div className="text-4xl font-bold mb-2">{courses.length > 0 ? `${courses.length}+` : '—'}</div>
                    <div className="text-gray-600">Cours disponibles</div>
                  </div>

                  <div>
                    <div className="text-4xl font-bold mb-2">
                      <Award className="w-10 h-10 mx-auto text-primary" />
                    </div>
                    <div className="text-gray-600">Certifications</div>
                  </div>

                  <div>
                    <div className="text-4xl font-bold mb-2">
                      <Users className="w-10 h-10 mx-auto text-primary" />
                    </div>
                    <div className="text-gray-600">Formateurs experts</div>
                  </div>

                  <div>
                    <div className="text-4xl font-bold mb-2">
                      <TrendingUp className="w-10 h-10 mx-auto text-primary" />
                    </div>
                    <div className="text-gray-600">Progression suivie</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-accent/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl mb-4">
              Pourquoi choisir Iz Academy ?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Une plateforme complète pour votre apprentissage en ligne
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-primary" />
              </div>
              <h3 className="mb-2">Cours de qualité</h3>
              <p className="text-muted-foreground">
                Des contenus créés par des experts du domaine
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h3 className="mb-2">Communauté active</h3>
              <p className="text-muted-foreground">
                Échangez avec les formateurs et autres étudiants
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-primary" />
              </div>
              <h3 className="mb-2">Certification</h3>
              <p className="text-muted-foreground">
                Obtenez un certificat reconnu après validation
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
              <h3 className="mb-2">Suivi personnalisé</h3>
              <p className="text-muted-foreground">
                Suivez votre progression en temps réel
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section id="courses" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl mb-4">
              Nos cours populaires
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Découvrez nos formations les plus demandées
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {courses.map((course: any) => {
              const lessonCount = course.modules?.reduce((acc: number, m: any) => acc + (m._count?.lessons ?? 0), 0) ?? 0;
              return (
                <Link
                  key={course.id}
                  to={`/course/${course.id}`}
                  className="bg-card border border-border rounded-xl overflow-hidden transition-all duration-300 hover:shadow-[0_0_35px_rgba(56,82,233,0.4)] group flex flex-col"
                >
                  <div className="aspect-video bg-muted overflow-hidden relative">
                    <img
                      src={course.thumbnailUrl}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    {course.level && (
                      <span className="absolute top-2 right-2">
                        <Badge variant="secondary" className="text-xs">{course.level}</Badge>
                      </span>
                    )}
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {course.category?.name && (
                        <Badge variant="outline" className="text-xs">{course.category.name}</Badge>
                      )}
                    </div>
                    <h3 className="font-semibold text-base mb-1 line-clamp-1">{course.title}</h3>
                    <p className="text-muted-foreground text-sm mb-3 line-clamp-2 flex-1">
                      {course.shortDescription}
                    </p>
                    {course.teacher?.name && (
                      <div className="text-xs text-muted-foreground mb-3">
                        Par <span className="font-medium text-foreground">{course.teacher.name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4 flex-wrap">
                      {course.duration && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {course.duration}
                        </span>
                      )}
                      {course.modules?.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Layers className="w-3 h-3" />
                          {course.modules.length} module{course.modules.length > 1 ? 's' : ''}
                        </span>
                      )}
                      {lessonCount > 0 && (
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          {lessonCount} leçon{lessonCount > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <span className="font-semibold text-base">{course.price ? `${course.price} DT` : 'Gratuit'}</span>
                      <span className="text-primary flex items-center gap-1 text-sm font-medium">
                        Voir le cours
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
            {courses.length === 0 && (
              <div className="col-span-4 text-center py-12 text-muted-foreground">
                Chargement des cours...
              </div>
            )}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/courses"
              className="px-8 py-3 bg-primary text-primary-foreground rounded-lg transition-all duration-300 hover:shadow-[0_0_30px_rgba(56,82,233,0.5)] inline-block"
            >
              Voir tous les cours
            </Link>
          </div>
        </div>
      </section>

      {/* Demo Video Section */}
      <section id="demo" className="py-20 px-4 scroll-mt-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl mb-4">
              Découvrez Iz Academy en action
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Explorez notre plateforme et voyez comment elle facilite
              l'apprentissage pour tous
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Video Placeholder */}
<div className="relative aspect-video rounded-2xl overflow-hidden shadow-xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(56,82,233,0.45),0_0_60px_rgba(105,63,203,0.35),0_0_90px_rgba(223,98,160,0.3)] group"
            >
              <img   src="https://images.unsplash.com/photo-1771054244019-96f9db9720b6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvbmxpbmUlMjBsZWFybmluZyUyMHZpZGVvJTIwY29uZmVyZW5jZSUyMGVkdWNhdGlvbnxlbnwxfHx8fDE3NzM1MTI2Nzh8MA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Démo de la plateforme Iz Academy"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/30 transition">
                <button
                  type="button"
                  className="w-20 h-20 bg-white rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-[0_0_30px_rgba(255,255,255,0.8)]"
                >
                  <Play className="w-10 h-10 text-primary ml-1" />
                </button>
              </div>
            </div>

            {/* Features List */}
            <div className="space-y-6">
              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Interface intuitive</h3>
                  <p className="text-muted-foreground text-sm">
                    Navigation simple et claire pour étudiants, formateurs et
                    administrateurs
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">
                    Progression en temps réel
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Suivez votre avancement et débloquez les quiz après avoir
                    complété les leçons
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">
                    Validation par des experts
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Vos projets sont évalués par des formateurs professionnels
                    avec feedback détaillé
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">
                    Certification reconnue
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Obtenez votre certificat automatiquement en remplissant les
                    critères de réussite
                  </p>
                </div>
              </div>

              {/*<div className="pt-4">
                <Link
                  to="/register"
                  className="px-8 py-3 text-white rounded-lg transition-all duration-300 hover:shadow-[0_0_30px_rgba(56,82,233,0.5)] inline-flex items-center gap-2"
                  style={{
                    backgroundImage:
                      'linear-gradient(90deg, #3852e9, #693fcb)',
                  }}
                >
                  Commencer gratuitement
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>*/}
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl mb-4">Restez informé</h2>
          <p className="text-muted-foreground mb-8">
            Inscrivez-vous à notre newsletter pour recevoir nos dernières
            actualités
          </p>
          <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Votre adresse email"
              className="flex-1 px-4 py-3 border border-border rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="submit"
              className="px-8 py-3 bg-primary text-primary-foreground rounded-lg transition-all duration-300 hover:shadow-[0_0_25px_rgba(56,82,233,0.5)]"
            >
              S'inscrire
            </button>
          </form>
        </div>
      </section>

      <Footer />
    </div>
  );
}