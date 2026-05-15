import { Link, useLocation, useNavigate } from 'react-router';
import { useState, useRef } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Award,
  MessageSquare,
  Menu,
  GraduationCap,
  LogOut,
  Bot,
  Sparkles,
  ChevronDown,
  User,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface StudentLayoutProps {
  children: React.ReactNode;
}

export function StudentLayout({ children }: StudentLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, loading } = useAuth();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const navigation = [
    { name: 'Tableau de bord', href: '/student', icon: LayoutDashboard },
    { name: 'Mes cours', href: '/student/courses', icon: BookOpen },
    { name: 'Certificats', href: '/student/certificates', icon: Award },
    { name: 'Messages', href: '/student/messages', icon: MessageSquare },
    { name: 'Assistant virtuel', href: '/student/career', icon: Bot },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleAvatarColor = (role?: string) => {
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
                      className={`w-4 h-4 transition-transform ${
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
            mt-16 lg:mt-0
          `}
        >
          <nav className="p-4 space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              const isCoachRoute = item.href === '/student/career';
              const locked = !user?.hasCompletedCoach && !isCoachRoute;

              return locked ? (
                <span
                  key={item.name}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg opacity-40 cursor-not-allowed"
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                  {isCoachRoute && <Sparkles className="w-3.5 h-3.5 ml-auto" />}
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
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                  {isCoachRoute && <Sparkles className="w-3.5 h-3.5 ml-auto" />}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* OVERLAY */}
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