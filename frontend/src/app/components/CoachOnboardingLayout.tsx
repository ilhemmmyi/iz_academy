import { Link, useNavigate } from 'react-router';
import { GraduationCap, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface Props {
  children: React.ReactNode;
}

/**
 * Minimal layout used during the Coach IA onboarding flow.
 * No sidebar — just brand header + centered content area.
 */
export function CoachOnboardingLayout({ children }: Props) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-accent/30">
      {/* Thin top bar — brand only */}
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2">
              <GraduationCap className="w-8 h-8 text-primary" />
              <span className="font-semibold text-xl">Iz Academy</span>
            </Link>

            {user && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-accent rounded-lg text-sm">
                  <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {(user.name || 'É').charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline">{user.name}</span>
                </div>
                <button
                  onClick={() => { logout(); navigate('/login'); }}
                  className="p-2 hover:bg-accent rounded-lg transition"
                  title="Déconnexion"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
