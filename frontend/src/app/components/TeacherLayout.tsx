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
import { useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';

interface TeacherLayoutProps {
  children: React.ReactNode;
}

export function TeacherLayout({ children }: TeacherLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, loading } = useAuth();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const navigation = [
    { name: 'Tableau de bord', href: '/teacher', icon: LayoutDashboard },
    { name: 'Mes cours', href: '/teacher/courses', icon: BookOpen },
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

            {/* RIGHT - USER MENU (corrigé comme ton navbar) */}
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
            mt-16 lg:mt-0
          `}
        >
          <nav className="p-4 space-y-2">
            {navigation.map((item) => {
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
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
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