import { Link, useNavigate, useLocation } from 'react-router';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/auth.api';

type Mode = 'login' | 'register';

const GoogleIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);


export function Login() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { login, loginWithGoogle } = useAuth();

  const locationState        = location.state as any;
  const passwordResetSuccess = locationState?.passwordReset === true;
  const initialMode: Mode    = locationState?.mode === 'register' ? 'register' : 'login';

  const [mode,          setMode]          = useState<Mode>(initialMode);
  const [isLoading,     setIsLoading]     = useState(false);
  const [isGoogLoading, setIsGoogLoading] = useState(false);
  const [showPassword,  setShowPassword]  = useState(false);

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [reg, setReg] = useState({ name: '', email: '', password: '', confirm: '' });

  useEffect(() => { setShowPassword(false); }, [mode]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await login(email, password);
      toast.success('Connexion réussie !');
      if (res.user.role === 'STUDENT')      navigate('/student');
      else if (res.user.role === 'TEACHER') navigate('/teacher');
      else                                  navigate('/admin');
    } catch (err: any) {
      toast.error(err.message || 'Identifiants invalides');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reg.password !== reg.confirm) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    setIsLoading(true);
    try {
      await authApi.register({ name: reg.name, email: reg.email, password: reg.password });
      navigate('/check-email', { state: { email: reg.email } });
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la création du compte');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
    setIsGoogLoading(true);
    try {
      const res = await loginWithGoogle();
      toast.success('Connexion réussie !');
      if (res.user.role === 'STUDENT')      navigate('/student');
      else if (res.user.role === 'TEACHER') navigate('/teacher');
      else                                  navigate('/admin');
    } catch (err: any) {
      toast.error(err.message || 'Connexion Google échouée');
    } finally {
      setIsGoogLoading(false);
    }
  };

  const inputCls =
    'w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm ' +
    'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ' +
    'transition placeholder:text-gray-400 text-gray-900';

  return (
    <div className="min-h-screen flex" style={{ scrollbarGutter: 'stable' }}>

      {/* ── Left panel ─────────────────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden sticky top-0 h-screen">
        {/* Photo */}
        <img
          src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Dark gradient overlay — stronger at top for logo, lighter in center */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(30,27,75,0.72) 0%, rgba(30,27,75,0.35) 45%, rgba(30,27,75,0.60) 100%)',
          }}
        />

        {/* Logo */}
        <div className="relative z-10 px-12 pt-10 self-start w-full">
          <Link to="/" className="inline-flex items-center gap-3">
            <img src="/iz-logo.png" alt="IZ Academy" className="h-9 w-auto brightness-0 invert" />
            <span className="font-bold text-xl text-white tracking-tight">IZ Academy</span>
          </Link>
        </div>
      </div>

      {/* ── Right panel ────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-white overflow-y-auto">

        {/* Mobile logo */}
        <div className="lg:hidden mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <img src="/iz-logo.png" alt="IZ Academy" className="h-8 w-auto" />
            <span className="font-bold text-lg tracking-tight">IZ Academy</span>
          </Link>
        </div>

        <div className="w-full max-w-sm">

          {/* Heading */}
          <div className="mb-7">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {mode === 'login' ? 'Bon retour !' : 'Créer un compte'}
            </h1>
            <p className="text-gray-500 text-sm">
              {mode === 'login'
                ? 'Connectez-vous pour accéder à votre espace'
                : "Commencez votre parcours d'apprentissage"}
            </p>
          </div>

          {/* Mode tabs */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-7">
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                  mode === m
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {m === 'login' ? 'Connexion' : 'Inscription'}
              </button>
            ))}
          </div>

          {/* Password reset banner */}
          {passwordResetSuccess && mode === 'login' && (
            <div className="mb-5 p-3.5 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
              Mot de passe réinitialisé avec succès ! Connectez-vous.
            </div>
          )}

          {/* ── Login form ── */}
          {mode === 'login' && (
            <form key="login" onSubmit={handleLogin} className="space-y-4 auth-form-in" autoComplete="on">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input id="email" type="email" value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre@email.com" autoComplete="email"
                    className={inputCls} required />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">Mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input id="password" type={showPassword ? 'text' : 'password'} value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" autoComplete="new-password"
                    className={`${inputCls} pr-10`} required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" className="w-3.5 h-3.5 rounded border-gray-300 accent-indigo-600" />
                  <span className="text-xs text-gray-500">Se souvenir de moi</span>
                </label>
                <Link to="/forgot-password" className="text-xs text-indigo-600 hover:underline">
                  Mot de passe oublié ?
                </Link>
              </div>

              <button type="submit" disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-50 mt-2"
                style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)' }}>
                {isLoading ? 'Connexion...' : <><span>Se connecter</span><ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          )}

          {/* ── Register form ── */}
          {mode === 'register' && (
            <form key="register" onSubmit={handleRegister} className="space-y-4 auth-form-in" autoComplete="on">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">Nom complet</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input id="name" type="text" value={reg.name}
                    onChange={(e) => setReg({ ...reg, name: e.target.value })}
                    placeholder="Votre nom complet" autoComplete="off"
                    className={inputCls} required />
                </div>
              </div>

              <div>
                <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input id="reg-email" type="email" value={reg.email}
                    onChange={(e) => setReg({ ...reg, email: e.target.value })}
                    placeholder="votre@email.com" autoComplete="email"
                    className={inputCls} required />
                </div>
              </div>

              <div>
                <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700 mb-1.5">Mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input id="reg-password" type={showPassword ? 'text' : 'password'} value={reg.password}
                    onChange={(e) => setReg({ ...reg, password: e.target.value })}
                    placeholder="••••••••" autoComplete="new-password"
                    className={`${inputCls} pr-10`} required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input id="confirm-password" type={showPassword ? 'text' : 'password'} value={reg.confirm}
                    onChange={(e) => setReg({ ...reg, confirm: e.target.value })}
                    placeholder="••••••••" autoComplete="new-password"
                    className={inputCls} required />
                </div>
              </div>

              <label className="flex items-start gap-2 cursor-pointer select-none">
                <input type="checkbox" className="w-3.5 h-3.5 mt-0.5 rounded border-gray-300 accent-indigo-600" required />
                <span className="text-xs text-gray-500">
                  J'accepte les{' '}
                  <a href="#" className="text-indigo-600 hover:underline">conditions d'utilisation</a>
                  {' '}et la{' '}
                  <a href="#" className="text-indigo-600 hover:underline">politique de confidentialité</a>
                </span>
              </label>

              <button type="submit" disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-50 mt-2"
                style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)' }}>
                {isLoading ? 'Création...' : <><span>Créer mon compte</span><ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          )}

          {/* Google */}
          <div className="mt-6">
            <div className="relative flex items-center gap-3">
              <div className="flex-1 border-t border-gray-200" />
              <span className="text-xs text-gray-400 px-1">ou</span>
              <div className="flex-1 border-t border-gray-200" />
            </div>
            <button type="button" onClick={handleGoogle} disabled={isGoogLoading}
              className="mt-4 w-full flex items-center justify-center gap-3 py-2.5 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 text-sm font-medium text-gray-700 transition disabled:opacity-50">
              <GoogleIcon />
              {isGoogLoading ? 'Connexion...' : 'Continuer avec Google'}
            </button>
          </div>

          {/* Mode toggle */}
          <p className="mt-7 text-center text-xs text-gray-500">
            {mode === 'login' ? "Pas encore de compte ?" : "Déjà un compte ?"}{' '}
            <button type="button"
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="text-indigo-600 font-medium hover:underline">
              {mode === 'login' ? 'Créer un compte' : 'Se connecter'}
            </button>
          </p>

        </div>
      </div>
    </div>
  );
}
