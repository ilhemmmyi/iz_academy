import { Link, useNavigate, useLocation } from 'react-router';
import { GraduationCap, Menu, X, LayoutDashboard, User, LogOut, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

function getDashboardPath(role: string) {
  if (role === 'TEACHER') return '/teacher';
  if (role === 'ADMIN') return '/admin';
  return '/student';
}

function getRoleAvatarColor(role: string) {
  if (role === 'TEACHER') return 'bg-teal-500';
  if (role === 'ADMIN') return 'bg-violet-500';
  return 'bg-indigo-500'; // STUDENT + default
}

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async () => {
    setIsUserMenuOpen(false);
    await logout();
    navigate('/');
  };

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2">
            <GraduationCap className="w-8 h-8 text-primary" />
            <span className="font-semibold text-xl">Iz Academy</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6 flex-1 justify-center">
            {([
              { label: 'Accueil', to: '/', exact: true },
              { label: 'Cours', to: '/courses', exact: false },
              { label: 'À propos', to: '/about', exact: true },
              { label: 'Contact', to: '/contact', exact: true },
            ] as { label: string; to: string; exact: boolean }[]).map(({ label, to, exact }) => {
              const active = to.startsWith('/#')
                ? false
                : exact ? location.pathname === to : location.pathname.startsWith(to);
              return (
                <a
                  key={to}
                  href={to.startsWith('/#') ? to : undefined}
                  onClick={to.startsWith('/#') ? undefined : (e) => { e.preventDefault(); navigate(to); }}
                  {...(!to.startsWith('/#') ? { role: 'link' } : {})}
                  className={`relative pb-1 transition cursor-pointer ${active ? 'text-primary font-medium' : 'text-foreground hover:text-primary'}`}
                >
                  {label}
                  {active && (
                    <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
                </a>
              );
            })}
          </div>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-2">
            {!loading && user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent transition"
                >
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className={`w-8 h-8 rounded-full ${getRoleAvatarColor(user.role)} text-white flex items-center justify-center text-sm font-semibold`}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm font-medium max-w-[120px] truncate">{user.name}</span>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white border border-border rounded-xl shadow-lg py-1 z-50">
                    <div className="px-4 py-2 border-b border-border">
                      <p className="text-sm font-semibold truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <Link
                      to={getDashboardPath(user.role)}
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
            ) : !loading ? (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-primary hover:bg-accent rounded-lg transition-all duration-300 hover:shadow-[0_0_20px_rgba(56,82,233,0.3)]"
                >
                  Connexion
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg transition-all duration-300 hover:shadow-[0_0_25px_rgba(56,82,233,0.5)]"
                >
                  S'inscrire
                </Link>
              </>
            ) : null}
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-3">
            {([
              { label: 'Accueil', to: '/', exact: true },
              { label: 'Cours', to: '/courses', exact: false },
              { label: 'À propos', to: '/about', exact: true },
              { label: 'Contact', to: '/contact', exact: true },
            ] as { label: string; to: string; exact: boolean }[]).map(({ label, to, exact }) => {
              const active = to.startsWith('/#')
                ? false
                : exact ? location.pathname === to : location.pathname.startsWith(to);
              return (
                <a
                  key={to}
                  href={to.startsWith('/#') ? to : undefined}
                  onClick={to.startsWith('/#')
                    ? () => setIsMenuOpen(false)
                    : (e) => { e.preventDefault(); navigate(to); setIsMenuOpen(false); }}
                  className={`flex items-center gap-2 py-2 cursor-pointer ${active ? 'text-primary font-medium' : 'text-foreground hover:text-primary transition'}`}
                >
                  {active && <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />}
                  {label}
                </a>
              );
            })}

            {!loading && user ? (
              <div className="border-t border-border pt-3">
                <div className="flex items-center gap-3 py-2">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="w-9 h-9 rounded-full object-cover" />
                  ) : (
                    <div className={`w-9 h-9 rounded-full ${getRoleAvatarColor(user.role)} text-white flex items-center justify-center font-semibold`}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <Link to={getDashboardPath(user.role)} className="flex items-center gap-2 py-2 text-foreground hover:text-primary transition" onClick={() => setIsMenuOpen(false)}>
                  <LayoutDashboard className="w-4 h-4" />Mon tableau de bord
                </Link>
                <Link to="/profile" className="flex items-center gap-2 py-2 text-foreground hover:text-primary transition" onClick={() => setIsMenuOpen(false)}>
                  <User className="w-4 h-4" />Mon profil
                </Link>
                <button onClick={() => { setIsMenuOpen(false); handleLogout(); }} className="flex items-center gap-2 py-2 text-red-600 w-full">
                  <LogOut className="w-4 h-4" />Se déconnecter
                </button>
              </div>
            ) : !loading ? (
              <>
                <Link to="/login" className="block py-2 text-primary" onClick={() => setIsMenuOpen(false)}>Connexion</Link>
                <Link to="/register" className="block py-2 px-4 bg-primary text-primary-foreground rounded-lg text-center" onClick={() => setIsMenuOpen(false)}>S'inscrire</Link>
              </>
            ) : null}
          </div>
        )}
      </div>
    </nav>
  );
}
