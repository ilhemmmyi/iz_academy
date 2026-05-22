import { Link, useLocation, useNavigate } from 'react-router';
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  GraduationCap,
  Menu,
  LogOut,
  User,
  BookOpen,
  FolderGit2,
  ChevronDown,
} from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { coursesApi } from '../../api/courses.api';

interface TeacherLayoutProps {
  children: React.ReactNode;
}

export function TeacherLayout({ children }: TeacherLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, loading } = useAuth();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isCoursesOpen, setIsCoursesOpen] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const isOnCoursePage = location.pathname.startsWith('/teacher/course/');
  const activeCourseId = isOnCoursePage ? location.pathname.split('/')[3] : null;

  // Auto-expand when navigating to a course page
  useEffect(() => {
    if (isOnCoursePage) setIsCoursesOpen(true);
  }, [isOnCoursePage]);

  // Fetch teacher's courses for sidebar
  useEffect(() => {
    coursesApi.getMine()
      .then((data: any) => setCourses(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const topNav = [
    { name: 'Tableau de bord', href: '/teacher', icon: LayoutDashboard },
  ];

  const bottomNav = [
    { name: 'Projets étudiants', href: '/teacher/projects', icon: FolderGit2 },
    { name: 'Étudiants', href: '/teacher/students', icon: Users },
    { name: 'Messages', href: '/teacher/messages', icon: MessageSquare },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleAvatarColor = (role?: string) => {
    if (role === 'teacher') return 'bg-teal-500';
    if (role === 'admin') return 'bg-red-500';
    return 'bg-indigo-500';
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
                <GraduationCap className="w-8 h-8 text-primary" />
                <span className="font-semibold text-xl">Iz Academy</span>
              </Link>

              <span className="hidden sm:inline px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                Formateur
              </span>
            </div>

            {/* RIGHT - USER MENU */}
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
                        alt={user.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className={`w-8 h-8 rounded-full ${getRoleAvatarColor(
                          user.role
                        )} text-white flex items-center justify-center text-sm font-semibold`}
                      >
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <span className="text-sm font-medium max-w-[120px] truncate">
                      {user.name}
                    </span>

                    <ChevronDown
                      className={`w-4 h-4 text-muted-foreground transition-transform ${
                        isUserMenuOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white border border-border rounded-xl shadow-lg py-1 z-50">
                      <div className="px-4 py-2 border-b border-border">
                        <p className="text-sm font-semibold truncate">
                          {user.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>

                      <Link
                        to="/teacher"
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
        <aside
          className={`
            fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-border
            transform transition-transform duration-300 ease-in-out lg:translate-x-0
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            mt-16 lg:mt-0 flex flex-col
          `}
        >
          <nav className="p-4 space-y-1 flex-1 overflow-y-auto">

            {/* Top nav */}
            {topNav.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-accent'
                  }`}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  <span className="flex-1 text-[15px] font-medium">{item.name}</span>
                </Link>
              );
            })}

            {/* Mes cours — expandable */}
            <div>
              <button
                onClick={() => setIsCoursesOpen(!isCoursesOpen)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  isOnCoursePage && !isCoursesOpen
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground hover:bg-accent'
                }`}
              >
                <BookOpen className="w-5 h-5 shrink-0" />
                <span className="flex-1 text-left text-[15px] font-medium">Mes cours</span>
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
                  {courses.length === 0 ? (
                    <div className="pl-9 pr-3 py-2 text-xs text-muted-foreground italic">
                      Aucun cours pour l'instant
                    </div>
                  ) : (
                    courses.map((course: any) => {
                      const isActive = activeCourseId === course.id;
                      return (
                        <Link
                          key={course.id}
                          to={`/teacher/course/${course.id}`}
                          onClick={() => setIsSidebarOpen(false)}
                          className={`flex items-center gap-3 pl-9 pr-3 py-2.5 rounded-lg transition group ${
                            isActive
                              ? 'bg-primary text-primary-foreground'
                              : 'hover:bg-accent'
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium leading-snug truncate">
                              {course.title}
                            </p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span
                                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                  course.isPublished ? 'bg-emerald-500' : 'bg-amber-400'
                                } ${isActive ? 'opacity-80' : ''}`}
                              />
                              <span
                                className={`text-[10px] ${
                                  isActive ? 'text-primary-foreground/70' : 'text-muted-foreground'
                                }`}
                              >
                                {course.isPublished ? 'Publié' : 'Brouillon'}
                              </span>
                            </div>
                          </div>
                        </Link>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Bottom nav */}
            {bottomNav.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-accent'
                  }`}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  <span className="flex-1 text-[15px] font-medium">{item.name}</span>
                </Link>
              );
            })}

          </nav>
        </aside>

        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
