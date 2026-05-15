import { Link, useLocation, useNavigate } from 'react-router';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Settings,
  ChevronDown,
  GraduationCap,
  Menu,
  LogOut,
  User,
  Bell,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { enrollmentsApi } from '../../api/enrollments.api';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    enrollmentsApi
      .getAll()
      .then((data: any[]) =>
        setPendingCount(data.filter((e: any) => e.status === 'PENDING').length)
      )
      .catch(() => {});
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navigation = [
    { name: 'Tableau de bord', href: '/admin', icon: LayoutDashboard },
    {
      name: "Demandes d'inscription",
      href: '/admin/enrollment-requests',
      icon: Bell,
      badge: pendingCount,
    },
    { name: 'Utilisateurs', href: '/admin/users', icon: Users },
    { name: 'Cours', href: '/admin/courses', icon: BookOpen },
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
                <GraduationCap className="w-8 h-8 text-primary" />
                <span className="font-semibold text-xl">Iz Academy</span>
              </Link>

              <span className="hidden sm:inline px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                Administrateur
              </span>
            </div>

            {/* RIGHT (USER MENU like navbar) */}
            <div className="hidden md:flex items-center gap-2">
              {user && (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent transition"
                  >
                    <div className="w-8 h-8 rounded-full bg-violet-500 text-white flex items-center justify-center text-sm font-semibold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>

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
                        to="/admin"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent transition"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        Tableau de bord
                      </Link>

                      <Link
                        to="/profile"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent transition"
                        onClick={() => setIsUserMenuOpen(false)}
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
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition
                    ${isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}
                  `}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="flex-1">{item.name}</span>

                  {item.badge ? (
                    <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}

            {/* CONFIG */}
            <Link
              to="/admin/configuration"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                location.pathname.startsWith('/admin/configuration')
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent'
              }`}
              onClick={() => setIsSidebarOpen(false)}
            >
              <Settings className="w-5 h-5" />
              <span>Configuration</span>
            </Link>

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