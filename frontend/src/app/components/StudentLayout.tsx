import { Link, useLocation, useNavigate } from 'react-router';
import { useState } from 'react';
import { LayoutDashboard, BookOpen, Award, MessageSquare, Menu, GraduationCap, LogOut, Bot, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface StudentLayoutProps {
  children: React.ReactNode;
}

export function StudentLayout({ children }: StudentLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Tableau de bord', href: '/student', icon: LayoutDashboard },
    { name: 'Mes cours', href: '/student/courses', icon: BookOpen },
    { name: 'Certificats', href: '/student/certificates', icon: Award },
    { name: 'Messages', href: '/student/messages', icon: MessageSquare },
    { name: 'Coach Carrière IA', href: '/student/career', icon: Bot },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-accent/30">
      {/* Top Navigation */}
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
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-accent rounded-lg">
                <div className="w-7 h-7 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {(user?.name || 'É').charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline">{user?.name || 'Étudiant'}</span>
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
        {/* Sidebar */}
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
                  title="Complète le Coach IA pour débloquer"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg cursor-not-allowed opacity-40 text-foreground select-none"
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                  {isCoachRoute && <Sparkles className="w-3.5 h-3.5 ml-auto opacity-70" />}
                </span>
              ) : (
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
                  {isCoachRoute && <Sparkles className="w-3.5 h-3.5 ml-auto opacity-70" />}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Overlay for mobile */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>

    </div>
  );
}