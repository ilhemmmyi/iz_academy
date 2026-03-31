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
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

interface TeacherLayoutProps {
  children: React.ReactNode;
}

export function TeacherLayout({ children }: TeacherLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Tableau de bord', href: '/teacher', icon: LayoutDashboard },
    { name: 'Mes cours', href: '/teacher/courses', icon: BookOpen },
    { name: 'Projets étudiants', href: '/teacher/projects', icon: FolderGit2 },
    { name: 'Étudiants', href: '/teacher/students', icon: Users },
    { name: 'Messages', href: '/teacher/messages', icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-accent/30">
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
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

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-accent rounded-lg">
                <div className="w-7 h-7 rounded-full bg-teal-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {(user?.name || 'F').charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline">{user?.name || 'Formateur'}</span>
              </div>
              <button
                onClick={() => { logout(); navigate('/login'); }}
                className="p-2 hover:bg-accent rounded-lg transition"
                title="Déconnexion"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

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
                    ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground hover:bg-accent'
                    }
                  `}
                  onClick={() => setIsSidebarOpen(false)}
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