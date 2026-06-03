import { Link, useNavigate, useLocation } from 'react-router';
import { Mail, Lock } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGoogle } = useAuth();
  const passwordResetSuccess = (location.state as any)?.passwordReset === true;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await login(email, password);

      if (res.user.role === 'STUDENT') navigate('/student');
      else if (res.user.role === 'TEACHER') navigate('/teacher');
      else navigate('/admin');

      toast.success('Connexion réussie !');
    } catch (err: any) {
      toast.error(err.message || 'Identifiants invalides');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);

    try {
      const res = await loginWithGoogle();

      if (res.user.role === 'STUDENT') navigate('/student');
      else if (res.user.role === 'TEACHER') navigate('/teacher');
      else navigate('/admin');

      toast.success('Connexion avec Google réussie !');
    } catch (err: any) {
      toast.error(err.message || 'Connexion Google échouée');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden py-12 px-4"
      style={{ background: 'linear-gradient(150deg, #F5F3FF 0%, #EDE9FE 45%, #DBEAFE 100%)' }}
    >
      {/* Background blobs */}
      <div className="absolute -top-20 -right-20 w-[480px] h-[480px] rounded-full pointer-events-none"
        style={{ background: '#C4B5FD', opacity: 0.3, filter: 'blur(90px)' }} />
      <div className="absolute -bottom-20 -left-20 w-[420px] h-[420px] rounded-full pointer-events-none"
        style={{ background: '#93C5FD', opacity: 0.28, filter: 'blur(90px)' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] rounded-full pointer-events-none"
        style={{ background: '#F9A8D4', opacity: 0.18, filter: 'blur(80px)' }} />

      {/* Form — centered */}
      <div className="relative w-full max-w-md">

          {/* Header */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-6">
              <img src="/iz-logo.png" alt="Iz Solution" className="h-10 w-auto" />
              <span className="font-semibold text-2xl">Iz Solution</span>
            </Link>

            <h1 className="text-3xl font-bold mb-2">
              Connexion
            </h1>

            <p className="text-muted-foreground">
              Accédez à votre espace d'apprentissage
            </p>
          </div>

          {/* Card */}
          <div className="bg-white/85 backdrop-blur-sm border border-white/60 rounded-2xl p-8 shadow-lg">
            {passwordResetSuccess && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
                Mot de passe réinitialisé avec succès ! Connectez-vous avec votre nouveau mot de passe.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Email */}
              <div>
                <label htmlFor="email" className="block mb-2 font-medium">
                  Email
                </label>

                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />

                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre@email.com"
                    className="w-full pl-11 pr-4 py-3 border border-border rounded-xl bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block mb-2 font-medium">
                  Mot de passe
                </label>

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />

                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3 border border-border rounded-xl bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
              </div>

              {/* Remember */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                  />

                  <span className="text-sm">
                    Se souvenir de moi
                  </span>
                </label>

                <Link
                  to="/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  Mot de passe oublié ?
                </Link>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition disabled:opacity-50 font-medium"
              >
                {isLoading ? 'Connexion...' : 'Se connecter'}
              </button>
            </form>

            {/* Divider */}
            <div className="mt-6">
              <div className="relative flex items-center gap-3 my-4">
                <div className="flex-1 border-t border-border" />

                <span className="text-sm text-muted-foreground">
                  ou
                </span>

                <div className="flex-1 border-t border-border" />
              </div>

              {/* Google Button */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading}
                className="w-full flex items-center justify-center gap-3 px-6 py-3 border border-border rounded-xl bg-white hover:bg-gray-50 transition disabled:opacity-50"
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>

                {isGoogleLoading
                  ? 'Connexion...'
                  : 'Continuer avec Google'}
              </button>
            </div>

            {/* Register */}
            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">
                Pas encore de compte ?
              </span>{' '}

              <Link
                to="/register"
                className="text-primary hover:underline font-medium"
              >
                Créer un compte
              </Link>
            </div>
          </div>
      </div>
    </div>
  );
}