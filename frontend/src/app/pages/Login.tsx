import { Link, useNavigate } from 'react-router';
import { GraduationCap, Mail, Lock } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

export function Login() {
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await login(email, password);
      if (res.requires2FA) {
        sessionStorage.setItem('pending2FAUserId', res.userId);
        navigate('/verify-2fa');
        return;
      }
      // Redirect based on role
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
    <div className="min-h-screen flex">
      <div className="flex-1 flex items-center justify-center p-8 bg-accent/30">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-6">
              <GraduationCap className="w-10 h-10 text-primary" />
              <span className="font-semibold text-2xl">Iz Academy</span>
            </Link>
            <h1 className="mb-2">Connexion</h1>
            <p className="text-muted-foreground">
              Accédez à votre espace d'apprentissage
            </p>
          </div>

          <div className="bg-white border border-border rounded-xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block mb-2">
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
                    className="w-full pl-11 pr-4 py-3 border border-border rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block mb-2">
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
                    className="w-full pl-11 pr-4 py-3 border border-border rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-sm">Se souvenir de moi</span>
                </label>
                <a href="#" className="text-sm text-primary hover:underline">
                  Mot de passe oublié ?
                </a>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition disabled:opacity-50"
              >
                {isLoading ? 'Connexion...' : 'Se connecter'}
              </button>
            </form>

            <div className="mt-4">
              <div className="relative flex items-center gap-3 my-4">
                <div className="flex-1 border-t border-border" />
                <span className="text-sm text-muted-foreground">ou</span>
                <div className="flex-1 border-t border-border" />
              </div>
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading}
                className="w-full flex items-center justify-center gap-3 px-6 py-3 border border-border rounded-lg bg-white hover:bg-gray-50 transition disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {isGoogleLoading ? 'Connexion...' : 'Continuer avec Google'}
              </button>
            </div>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Pas encore de compte ? </span>
              <Link to="/register" className="text-primary hover:underline">
                Créer un compte
              </Link>
            </div>


          </div>
        </div>
      </div>

      <div className="hidden lg:block flex-1 bg-gradient-to-br from-primary via-primary to-[#1a1a2e] text-primary-foreground p-12">
        <div className="h-full flex flex-col justify-center max-w-lg mx-auto">
          <h2 className="text-4xl mb-6">Développez vos compétences avec Iz Academy</h2>
          <p className="text-xl text-primary-foreground/90 mb-8">
            Accédez à plus de 150 cours en ligne créés par des experts.
          </p>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-2xl">📚</span>
              </div>
              <div>
                <div className="font-semibold mb-1">Cours de qualité</div>
                <div className="text-primary-foreground/80">
                  Contenus créés par des professionnels
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-2xl">🎓</span>
              </div>
              <div>
                <div className="font-semibold mb-1">Certification</div>
                <div className="text-primary-foreground/80">
                  Certificats reconnus à la fin de chaque cours
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-2xl">💬</span>
              </div>
              <div>
                <div className="font-semibold mb-1">Support formateur</div>
                <div className="text-primary-foreground/80">
                  Communiquez directement avec vos formateurs
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}