import { Link, useNavigate } from 'react-router';
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
  const dropdownRef = useRef<HTMLDivElement>(null);

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
            <Link to="/" className="text-foreground hover:text-primary transition">Accueil</Link>
            <Link to="/courses" className="text-foreground hover:text-primary transition">Cours</Link>
            <Link to="/faq" className="text-foreground hover:text-primary transition">FAQ</Link>
            <Link to="/contact" className="text-foreground hover:text-primary transition">Contact</Link>
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
            <Link to="/" className="block py-2 text-foreground hover:text-primary transition" onClick={() => setIsMenuOpen(false)}>Accueil</Link>
            <Link to="/courses" className="block py-2 text-foreground hover:text-primary transition" onClick={() => setIsMenuOpen(false)}>Cours</Link>
            <Link to="/faq" className="block py-2 text-foreground hover:text-primary transition" onClick={() => setIsMenuOpen(false)}>FAQ</Link>
            <Link to="/contact" className="block py-2 text-foreground hover:text-primary transition" onClick={() => setIsMenuOpen(false)}>Contact</Link>

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
