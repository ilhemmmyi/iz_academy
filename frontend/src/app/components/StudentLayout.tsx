import { Link, useLocation, useNavigate } from 'react-router';
import { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Award,
  MessageSquare,
  Menu,
  LogOut,
  Bot,
  Sparkles,
  ChevronDown,
  User,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { enrollmentsApi } from '../../api/enrollments.api';

interface StudentLayoutProps {
  children: React.ReactNode;
  /** Live course progress to show in the sidebar while on a course page */
  liveProgress?: { courseId: string; pct: number };
}

export function StudentLayout({ children, liveProgress }: StudentLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, loading } = useAuth();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isCoursesOpen, setIsCoursesOpen] = useState(false);
  const [enrollments, setEnrollments] = useState<any[]>([]);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const isOnCoursePage = location.pathname.startsWith('/student/course/');
  const activeCourseId = isOnCoursePage ? location.pathname.split('/')[3] : null;

  // Auto-expand courses section when navigating to a course
  useEffect(() => {
    if (isOnCoursePage) setIsCoursesOpen(true);
  }, [isOnCoursePage]);

  // Fetch approved enrollments for sidebar listing
  useEffect(() => {
    if (!user?.hasCompletedCoach) return;
    enrollmentsApi.getMine()
      .then(data => setEnrollments(data.filter((e: any) => e.status === 'APPROVED' || e.status === 'PENDING')))
      .catch(() => {});
  }, [user?.hasCompletedCoach]);

  const topNav = [
    { name: 'Tableau de bord', href: '/student', icon: LayoutDashboard },
  ];

  const bottomNav = [
    { name: 'Certificats', href: '/student/certificates', icon: Award },
    { name: 'Messages', href: '/student/messages', icon: MessageSquare },
    { name: 'Assistant virtuel', href: '/student/career', icon: Bot },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-accent/30">

      {/* HEADER */}
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">

            {/* LEFT */}
            <div className="flex items-center gap-4">
              <button
                className="lg:hidden p-2"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                <Menu className="w-6 h-6" />
              </button>

              <Link to="/" className="flex items-center gap-2">
                <img src="/iz-logo.png" alt="IZ Academy" className="h-8 w-auto" />
            <span className="font-semibold text-xl">IZ Academy</span>
              </Link>
            </div>

            {/* RIGHT - USER DROPDOWN */}
            <div className="hidden md:flex items-center gap-2">
              {!loading && user && (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent transition"
                  >
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center text-sm font-semibold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <span className="text-sm font-medium max-w-[120px] truncate">
                      {user.name}
                    </span>

                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white border border-border rounded-xl shadow-lg py-1 z-50">
                      <div className="px-4 py-2 border-b border-border">
                        <p className="text-sm font-semibold truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>

                      <Link
                        to="/student"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent transition"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        Mon tableau de bord
                      </Link>

                      <Link
                        to="/profile"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent transition"
                      >
                        <User className="w-4 h-4" />
                        Mon profil
                      </Link>

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition"
                      >
                        <LogOut className="w-4 h-4" />
                        Se déconnecter
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* BODY */}
      <div className="flex flex-1">

        {/* SIDEBAR */}
        <aside
          className={`
            fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-border
            transform transition-transform duration-300 ease-in-out lg:translate-x-0
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            mt-16 lg:mt-0 flex flex-col
          `}
        >
          <nav className="p-4 space-y-1 flex-1 overflow-y-auto">

            {/* Top nav items (dashboard first) */}
            {topNav.map((item) => {
              const isActive = location.pathname === item.href;
              const isCoachRoute = item.href === '/student/career';
              const locked = !user?.hasCompletedCoach && !isCoachRoute;

              return locked ? (
                <span
                  key={item.name}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg opacity-40 cursor-not-allowed"
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  <span className="flex-1 text-[15px]">{item.name}</span>
                  {isCoachRoute && <Sparkles className="w-3.5 h-3.5" />}
                </span>
              ) : (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent'
                  }`}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  <span className="flex-1 text-[15px]">{item.name}</span>
                  {isCoachRoute && <Sparkles className="w-3.5 h-3.5" />}
                </Link>
              );
            })}

            {/* Courses collapsible section */}
            {!user?.hasCompletedCoach ? (
              <span className="flex items-center gap-3 px-4 py-3 rounded-lg opacity-40 cursor-not-allowed">
                <BookOpen className="w-5 h-5 shrink-0" />
                <span className="flex-1 text-[15px]">Mes cours</span>
              </span>
            ) : (
              <div>
                <button
                  onClick={() => setIsCoursesOpen(!isCoursesOpen)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    isOnCoursePage && !isCoursesOpen
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-accent'
                  }`}
                >
                  <BookOpen className="w-5 h-5 shrink-0" />
                  <span className="flex-1 text-left text-[15px]">Mes cours</span>
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                      isCoursesOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Animated sub-list */}
                <div
                  className={`overflow-hidden transition-all duration-200 ease-in-out ${
                    isCoursesOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="mt-1 space-y-0.5 pb-1">
                    {enrollments.length === 0 ? (
                      <div className="pl-9 pr-3 py-2 text-xs text-muted-foreground italic">
                        Aucun cours inscrit
                      </div>
                    ) : (
                      enrollments.map((enrollment: any) => {
                        const courseId = enrollment.course.id;
                        const isPending = enrollment.status === 'PENDING';

                        if (isPending) {
                          return (
                            <span
                              key={courseId}
                              className="flex items-center gap-3 pl-9 pr-3 py-2.5 rounded-lg cursor-not-allowed opacity-70"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium leading-snug truncate text-muted-foreground">
                                  {enrollment.course.title}
                                </p>
                                <p className="text-[10px] text-amber-500 mt-0.5">En attente</p>
                              </div>
                              <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            </span>
                          );
                        }

                        const storedPct: number = enrollment.progress?.percentage ?? 0;
                        const pct: number = liveProgress?.courseId === courseId ? liveProgress.pct : storedPct;
                        const isActive = activeCourseId === courseId;

                        const expired = !!enrollment.accessExpiresAt && new Date() > new Date(enrollment.accessExpiresAt);
                        const daysLeft = !expired && enrollment.accessExpiresAt
                          ? Math.ceil((new Date(enrollment.accessExpiresAt).getTime() - Date.now()) / 86400000)
                          : null;
                        const expiringSoon = daysLeft !== null && daysLeft <= 7;

                        return (
                          <Link
                            key={courseId}
                            to={`/student/course/${courseId}`}
                            onClick={() => setIsSidebarOpen(false)}
                            className={`flex items-center gap-3 pl-9 pr-3 py-2.5 rounded-lg transition group ${
                              isActive
                                ? 'bg-primary text-primary-foreground'
                                : 'hover:bg-accent'
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-medium leading-snug truncate ${
                                !isActive && expired ? 'text-red-500' : ''
                              }`}>
                                {enrollment.course.title}
                              </p>

                              {expired ? (
                                <p className="text-[10px] text-red-400 mt-0.5">Accès expiré</p>
                              ) : (
                                <div className="flex items-center gap-1.5 mt-1">
                                  <div className={`flex-1 h-1 rounded-full overflow-hidden ${
                                    isActive ? 'bg-primary-foreground/30' : 'bg-slate-100'
                                  }`}>
                                    <div
                                      className={`h-full rounded-full transition-all duration-500 ${
                                        isActive ? 'bg-primary-foreground' : pct >= 100 ? 'bg-emerald-500' : 'bg-primary'
                                      }`}
                                      style={{ width: `${Math.min(pct, 100)}%` }}
                                    />
                                  </div>
                                  <span className={`text-[10px] shrink-0 tabular-nums ${
                                    isActive ? 'text-primary-foreground/80'
                                    : expiringSoon ? 'text-amber-500'
                                    : 'text-muted-foreground'
                                  }`}>
                                    {expiringSoon ? `${daysLeft}j` : `${pct}%`}
                                  </span>
                                </div>
                              )}
                            </div>

                            {expired && !isActive && (
                              <Lock className="w-3.5 h-3.5 text-red-400 shrink-0" />
                            )}
                            {!expired && pct >= 100 && !isActive && (
                              <Award className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            )}
                          </Link>
                        );
                      })
                    )}

                    {/* Link to public catalogue */}
                    <Link
                      to="/courses"
                      onClick={() => setIsSidebarOpen(false)}
                      className="flex items-center gap-2 pl-9 pr-3 py-2 text-xs text-primary hover:underline transition"
                    >
                      + Découvrir les cours
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom nav items (Certificats, Messages, Assistant virtuel) */}
            {bottomNav.map((item) => {
              const isActive = location.pathname === item.href;
              const isCoachRoute = item.href === '/student/career';
              const locked = !user?.hasCompletedCoach && !isCoachRoute;

              return locked ? (
                <span
                  key={item.name}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg opacity-40 cursor-not-allowed"
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  <span className="flex-1 text-[15px]">{item.name}</span>
                  {isCoachRoute && <Sparkles className="w-3.5 h-3.5" />}
                </span>
              ) : (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent'
                  }`}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  <span className="flex-1 text-[15px]">{item.name}</span>
                  {isCoachRoute && <Sparkles className="w-3.5 h-3.5" />}
                </Link>
              );
            })}

          </nav>
        </aside>

        {/* OVERLAY (mobile) */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* CONTENT */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>

      </div>
    </div>
  );
}
