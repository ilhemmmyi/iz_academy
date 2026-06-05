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
  Zap,
} from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { useState, useEffect } from 'react';
import { coursesApi } from '../../api/courses.api';
import { settingsApi } from '../../api/settings.api';

export function LandingPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [videoUrl, setVideoUrl] = useState('');

  useEffect(() => {
    coursesApi.getAll()
      .then(data => setCourses(data.slice(0, 4)))
      .catch(() => {});
    settingsApi.getAll()
      .then(s => { if (s.homepageVideoUrl) setVideoUrl(s.homepageVideoUrl); })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen flex flex-col scroll-smooth">
      <Navbar />

      {/* ══════════════════════════════════════════
      HERO SECTION — Premium Redesign
      ══════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden py-14"
        style={{
  background: `
    radial-gradient(circle at 80% 50%, rgba(139,127,255,0.22) 0%, transparent 60%),
    radial-gradient(circle at 0% 100%, rgba(139,127,255,0.18) 0%, transparent 55%),
    linear-gradient(180deg,#ffffff 0%,#f7f7ff 60%,#f1f3ff 100%)
  `,
}}
      >
        {/* Dotted grid — top-right quadrant only, masked at edges */}
        <div
  aria-hidden="true"
  className="absolute pointer-events-none select-none"
  style={{
    top: 0,
    right: 0,
    width: '70%',
    height: '70%',

    // stronger + slightly larger dots
    backgroundImage:
      'radial-gradient(rgba(139,127,255,0.25) 1.5px, transparent 1.5px)',

    // tighter spacing = more visible pattern
    backgroundSize: '18px 18px',

    // softer fade instead of harsh cutoff
    maskImage:
      'radial-gradient(ellipse 80% 80% at 92% 18%, black 25%, transparent 75%)',
    WebkitMaskImage:
      'radial-gradient(ellipse 80% 80% at 92% 18%, black 25%, transparent 75%)',
  }}
/>

        {/* ── Content ───────────────────────────────── */}
        <div className="relative max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">

            {/* ─── LEFT COLUMN ──────────────────────── */}
            <div className="max-w-[520px]">

              {/* Top badge */}
              <div
                className="hero-anim-badge inline-flex items-center gap-2 px-3.5 py-1 rounded-full mb-4 select-none"
                style={{
                  background: 'linear-gradient(130deg, rgba(245,243,255,0.95) 0%, rgba(238,242,255,0.95) 100%)',
                  border: '1px solid rgba(139,92,246,0.28)',
                  boxShadow: '0 2px 10px rgba(124,58,237,0.1), 0 1px 2px rgba(0,0,0,0.04)',
                }}
              >
                <span
                  className="w-[18px] h-[18px] rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)' }}
                >
                  <svg width="9" height="9" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="M6 0.75L7.39 3.95L11 4.41L8.5 6.85L9.16 10.5L6 8.82L2.84 10.5L3.5 6.85L1 4.41L4.61 3.95L6 0.75Z" fill="white" />
                  </svg>
                </span>
                <span className="text-[11.5px] font-semibold tracking-wide" style={{ color: '#5b21b6' }}>
                  La meilleure plateforme pour apprendre en ligne
                </span>
              </div>

              {/* Main headline */}
              <h1
                className="hero-anim-headline font-bold leading-[1.07] tracking-[-0.02em] mb-3"
                style={{ fontSize: 'clamp(1.95rem, 3.3vw, 2.5rem)' }}
              >
                <span className="block" style={{ color: '#0c0c1d' }}>Apprenez.</span>
                <span
                  className="block"
                  style={{
                    backgroundImage: 'linear-gradient(105deg, #7c3aed 0%, #4f46e5 55%, #6366f1 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    paddingBottom: '0.1em',
                  }}
                >
                  Progressez.
                </span>
                <span className="block" style={{ color: '#0c0c1d' }}>Réalisez vos objectifs.</span>
              </h1>

              {/* Description */}
              <p
                className="hero-anim-content text-[14.5px] leading-relaxed mb-5"
                style={{ color: '#71717a', maxWidth: '400px' }}
              >
                Développez vos compétences avec des cours créés par des experts.<br />
                Projets pratiques, suivi personnalisé et certification reconnue.
              </p>

              {/* CTA buttons */}
              <div className="hero-anim-content flex flex-wrap items-center gap-3 mb-6">
                <a
                  href="#demo"
                  className="inline-flex items-center gap-2 px-5 py-[8px] rounded-xl text-white text-sm font-semibold transition-all duration-200 hover:opacity-90 hover:translate-y-[-1px] active:scale-[0.98] select-none"
                  style={{
                    background: '#0f0f1a',
                    boxShadow: '0 4px 14px rgba(15,15,26,0.32), 0 1px 3px rgba(15,15,26,0.18)',
                  }}
                >
                  Voir la démonstration
                  <ArrowRight style={{ width: '15px', height: '15px' }} />
                </a>
                <Link
                  to="/courses"
                  className="inline-flex items-center gap-2 px-5 py-[8px] rounded-xl text-sm font-semibold bg-white transition-all duration-200 hover:bg-violet-50 hover:border-violet-300 hover:translate-y-[-1px] active:scale-[0.98] select-none"
                  style={{
                    border: '1.5px solid rgba(0,0,0,0.11)',
                    color: '#18181b',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  }}
                >
                  <BookOpen style={{ width: '14px', height: '14px', color: '#7c3aed' }} />
                  Découvrir les cours
                </Link>
              </div>

              {/* Stats row */}
              <div className="hero-anim-content flex items-center gap-0">

                {/* Metric 1 — Étudiants */}
                <div className="flex items-center gap-2 pr-4">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(245,243,255,0.95)', border: '1px solid rgba(167,139,250,0.22)' }}
                  >
                    <Users style={{ width: '13px', height: '13px', color: '#7c3aed' }} />
                  </div>
                  <span className="text-[12.5px] font-bold" style={{ color: '#0c0c1d' }}>500+&nbsp;</span>
                  <span className="text-[11.5px]" style={{ color: '#a1a1aa' }}>Étudiants</span>
                </div>

                {/* Divider */}
                <div className="h-5 w-px mx-4 flex-shrink-0" style={{ background: 'rgba(0,0,0,0.1)' }} />

                {/* Metric 2 — Cours */}
                <div className="flex items-center gap-2 pr-4">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(238,242,255,0.95)', border: '1px solid rgba(99,102,241,0.2)' }}
                  >
                    <BookOpen style={{ width: '13px', height: '13px', color: '#4f46e5' }} />
                  </div>
                  <span className="text-[12.5px] font-bold" style={{ color: '#0c0c1d' }}>
                    {courses.length > 0 ? `${courses.length}+` : '10+'}&nbsp;
                  </span>
                  <span className="text-[11.5px]" style={{ color: '#a1a1aa' }}>Cours</span>
                </div>

                {/* Divider */}
                <div className="h-5 w-px mx-4 flex-shrink-0" style={{ background: 'rgba(0,0,0,0.1)' }} />

                {/* Metric 3 — Satisfaction */}
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(236,253,245,0.95)', border: '1px solid rgba(16,185,129,0.2)' }}
                  >
                    <TrendingUp style={{ width: '13px', height: '13px', color: '#059669' }} />
                  </div>
                  <span className="text-[12.5px] font-bold" style={{ color: '#0c0c1d' }}>98%&nbsp;</span>
                  <span className="text-[11.5px]" style={{ color: '#a1a1aa' }}>Satisfaction</span>
                </div>

              </div>
            </div>
            {/* END LEFT COLUMN */}

           {/* ─── RIGHT COLUMN ─────────────────────── */}
<div className="hidden md:flex justify-center items-center">
  <div className="relative w-full max-w-lg h-[270px]">

    {/* Purple circle — solid flat disc, soft edge fade */}
    <div
      className="absolute z-0"
      style={{
        width: '360px',
        height: '360px',
        borderRadius: '50%',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        background:
          'radial-gradient(circle, rgba(167,139,250,0.58) 0%, rgba(167,139,250,0.56) 62%, rgba(167,139,250,0.22) 84%, transparent 100%)',
      }}
    />

    {/* Outer ring */}
    <div
      className="absolute z-0"
      style={{
        width: '460px',
        height: '460px',
        borderRadius: '50%',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        border: '1px solid rgba(139,127,255,.10)',
      }}
    />

    {/* Student image — transparent PNG sits in front of the circle (no clip) */}
    <div
      className="absolute z-20"
      style={{
        width: '390px',
        height: '430px',
        left: '45%',
        top: '40%',
        transform: 'translate(-50%, -52%)',
      }}
    >
      <img
        src={
          new URL(
            './Capture_d_écran_2026-06-03_154635-removebg-preview (1).png',
            import.meta.url
          ).href
        }
        alt="Étudiant apprenant en ligne"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          objectPosition: 'center bottom',
          filter: 'drop-shadow(0 16px 32px rgba(15,15,26,0.16))',
        }}
      />
    </div>

    {/* Small glow */}
    <div
      className="absolute"
      style={{
        width: '100px',
        height: '100px',
        borderRadius: '50%',
        background: 'rgba(139,127,255,.18)',
        filter: 'blur(40px)',
        left: '10px',
        top: '20px',
      }}
    />

    {/* Right blob */}
    <div
      className="absolute"
      style={{
        width: '300px',
        height: '300px',
        right: '-60px',
        bottom: '-70px',
        borderRadius: '60% 40% 55% 45%',
        background:
          'linear-gradient(135deg, rgba(139,127,255,.12), rgba(139,127,255,.04))',
      }}
    />

    

    {/* Wave decoration */}
    <div
      className="absolute z-30"
      style={{
        bottom: '10px',
        left: '0px',
      }}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 40 - i * 8,
            height: 4,
            borderRadius: 999,
            background: '#7c3aed',
            transform: 'rotate(-25deg)',
            opacity: 0.75,
            marginTop: i ? 8 : 0,
            marginLeft: i * 14,
          }}
        />
      ))}
    </div>

    {/* Floating Card 1 */}
    <div className="hero-float-card-1 absolute z-30 flex items-center gap-3 px-3.5 py-2.5 rounded-2xl pointer-events-none select-none"
      style={{
        top: '27%',
        left: '-28px',
        background: 'rgba(255,255,255,.94)',
        backdropFilter: 'blur(18px)',
        border: '1px solid rgba(167,139,250,0.22)',
        boxShadow:
          '0 8px 28px rgba(124,58,237,0.13), 0 2px 8px rgba(0,0,0,0.06)',
      }}
    >
      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(245,243,255,1)' }}
      >
        <BookOpen style={{ width: '15px', height: '15px', color: '#7c3aed' }} />
      </div>
      <div>
        <p className="text-sm font-bold leading-none" style={{ color: '#0c0c1d' }}>
          {courses.length > 0 ? `${courses.length}+` : '10+'} cours
        </p>
        <p className="text-[10.5px] mt-1 leading-none" style={{ color: '#a1a1aa' }}>
          Disponibles
        </p>
      </div>
    </div>

    {/* Floating Card 2 */}
    <div className="hero-float-card-2 absolute z-20 flex items-center gap-3 px-3.5 py-2.5 rounded-2xl pointer-events-none select-none"
      style={{
        top: '8%',
        right: '-28px',
        background: 'rgba(255,255,255,.94)',
        backdropFilter: 'blur(18px)',
        border: '1px solid rgba(124,58,237,0.2)',
        boxShadow:
          '0 8px 28px rgba(124,58,237,0.13), 0 2px 8px rgba(0,0,0,0.06)',
      }}
    >
      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(245,243,255,1)' }}
      >
        <Zap style={{ width: '15px', height: '15px', color: '#7c3aed' }} />
      </div>
      <div>
        <p className="text-sm font-bold leading-none" style={{ color: '#0c0c1d' }}>
          Coach IA
        </p>
        <p className="text-[10.5px] mt-1 leading-none" style={{ color: '#a1a1aa' }}>
          Carrière personnalisée
        </p>
      </div>
    </div>

    {/* Floating Card 3 */}
    <div className="hero-float-card-3 absolute z-20 flex items-center gap-3 px-3.5 py-2.5 rounded-2xl pointer-events-none select-none"
      style={{
        bottom: '56px',
        right: '-28px',
        background: 'rgba(255,255,255,.94)',
        backdropFilter: 'blur(18px)',
        border: '1px solid rgba(16,185,129,0.2)',
        boxShadow:
          '0 8px 28px rgba(5,150,105,0.1), 0 2px 8px rgba(0,0,0,0.06)',
      }}
    >
      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(236,253,245,1)' }}
      >
        <Award style={{ width: '15px', height: '15px', color: '#059669' }} />
      </div>
      <div>
        <p className="text-sm font-bold leading-none" style={{ color: '#0c0c1d' }}>
          Certifié
        </p>
        <p className="text-[10.5px] mt-1 leading-none" style={{ color: '#a1a1aa' }}>
          À la fin du cours
        </p>
      </div>
    </div>

  </div>
</div>
{/* END RIGHT COLUMN */}
            {/* END RIGHT COLUMN */}

          </div>
        </div>
      </section>
      {/* END HERO SECTION */}

      {/* Features Section */}
      <section className="py-20 px-4 bg-accent/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl mb-4">
              Pourquoi choisir Iz Solution ?
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
              const lessonCount = course.modules?.reduce(
                (acc: number, m: any) => acc + (m._count?.lessons ?? 0),
                0
              ) ?? 0;
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
                      className="w-full h-full object-contain group-hover:scale-105 transition duration-300"
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
                      <span className="font-semibold text-base">
                        {course.price ? `${course.price} DT` : 'Gratuit'}
                      </span>
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
              Découvrez Iz Solution en action
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Explorez notre plateforme et voyez comment elle facilite
              l'apprentissage pour tous
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Video — dynamic from admin settings */}
            <div className="relative aspect-video rounded-2xl overflow-hidden shadow-xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(56,82,233,0.45),0_0_60px_rgba(105,63,203,0.35),0_0_90px_rgba(223,98,160,0.3)] group">
              {videoUrl ? (
                <video
                  src={videoUrl}
                  controls
                  className="w-full h-full object-cover"
                  preload="metadata"
                />
              ) : (
                <>
                  <img
                    src="https://images.unsplash.com/photo-1771054244019-96f9db9720b6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvbmxpbmUlMjBsZWFybmluZyUyMHZpZGVvJTIwY29uZmVyZW5jZSUyMGVkdWNhdGlvbnxlbnwxfHx8fDE3NzM1MTI2Nzh8MA&ixlib=rb-4.1.0&q=80&w=1080"
                    alt="Démo de la plateforme Iz Solution"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/30 transition">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
                      <Play className="w-10 h-10 text-primary ml-1" />
                    </div>
                  </div>
                </>
              )}
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
                    Navigation simple et claire pour étudiants, formateurs et administrateurs
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Progression en temps réel</h3>
                  <p className="text-muted-foreground text-sm">
                    Suivez votre avancement et débloquez les quiz après avoir complété les leçons
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Validation par des experts</h3>
                  <p className="text-muted-foreground text-sm">
                    Vos projets sont évalués par des formateurs professionnels avec feedback détaillé
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Certification reconnue</h3>
                  <p className="text-muted-foreground text-sm">
                    Obtenez votre certificat automatiquement en remplissant les critères de réussite
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}