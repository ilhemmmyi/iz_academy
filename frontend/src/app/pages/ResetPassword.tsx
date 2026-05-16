import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { GraduationCap, Lock, Eye, EyeOff, XCircle } from 'lucide-react';
import { authApi } from '../../api/auth.api';

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState('');

  const passwordStrong = password.length >= 8;
  const passwordsMatch = password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrorCode('');

    if (!passwordStrong) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (!passwordsMatch) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resetPassword(token, password);
      navigate('/login', { state: { passwordReset: true } });
    } catch (err: any) {
      const body = err as any;
      setErrorCode(body?.code ?? '');
      setError(err.message || 'Erreur serveur.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-accent/30 p-8">
        <div className="w-full max-w-md text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-8">
            <GraduationCap className="w-10 h-10 text-primary" />
            <span className="font-semibold text-2xl">Iz Academy</span>
          </Link>
          <div className="bg-white border border-border rounded-2xl p-10">
            <XCircle className="w-14 h-14 text-destructive mx-auto mb-4" />
            <h1 className="text-xl font-semibold mb-3">Lien invalide</h1>
            <p className="text-muted-foreground text-sm mb-6">Ce lien de réinitialisation est invalide.</p>
            <Link to="/forgot-password" className="inline-block w-full px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition font-medium text-center">
              Demander un nouveau lien
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-accent/30 p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <GraduationCap className="w-10 h-10 text-primary" />
            <span className="font-semibold text-2xl">Iz Academy</span>
          </Link>
        </div>

        <div className="bg-white border border-border rounded-2xl p-8 shadow-sm">
          <h1 className="text-2xl font-semibold mb-2">Nouveau mot de passe</h1>
          <p className="text-muted-foreground text-sm mb-6">
            Choisissez un nouveau mot de passe sécurisé pour votre compte.
          </p>

          {error && (
            <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              <p>{error}</p>
              {(errorCode === 'TOKEN_EXPIRED' || errorCode === 'INVALID_TOKEN') && (
                <Link to="/forgot-password" className="inline-block mt-2 text-primary underline font-medium">
                  Demander un nouveau lien
                </Link>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="password" className="block mb-2 font-medium text-sm">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-11 py-3 border border-border rounded-xl bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {password && (
                <p className={`mt-1.5 text-xs ${passwordStrong ? 'text-green-600' : 'text-red-500'}`}>
                  {passwordStrong ? '✓ Longueur suffisante' : 'Minimum 8 caractères requis'}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block mb-2 font-medium text-sm">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-11 py-3 border border-border rounded-xl bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {confirmPassword && (
                <p className={`mt-1.5 text-xs ${passwordsMatch ? 'text-green-600' : 'text-red-500'}`}>
                  {passwordsMatch ? '✓ Les mots de passe correspondent' : 'Les mots de passe ne correspondent pas'}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition disabled:opacity-50 font-medium"
            >
              {isLoading ? 'Réinitialisation...' : 'Réinitialiser mon mot de passe'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-border text-center text-sm text-muted-foreground">
            <Link to="/login" className="text-primary hover:underline">
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
