import { useState } from 'react';
import { Link } from 'react-router';
import { GraduationCap, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { authApi } from '../../api/auth.api';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Erreur serveur. Réessayez.');
    } finally {
      setIsLoading(false);
    }
  };

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
          {!sent ? (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-semibold mb-2">Mot de passe oublié ?</h1>
                <p className="text-muted-foreground text-sm">
                  Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block mb-2 font-medium text-sm">
                    Adresse email
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
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition disabled:opacity-50 font-medium"
                >
                  {isLoading ? 'Envoi en cours...' : 'Envoyer le lien'}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="flex justify-center mb-5">
                <CheckCircle className="w-14 h-14 text-green-500" />
              </div>
              <h1 className="text-xl font-semibold text-center mb-3">Email envoyé !</h1>
              <p className="text-muted-foreground text-sm text-center mb-2">
                Si un compte existe avec l'adresse <strong>{email}</strong>, vous recevrez un lien de réinitialisation.
              </p>
              <p className="text-muted-foreground text-sm text-center mb-6">
                Vérifiez aussi votre dossier spam.
              </p>
              <button
                onClick={() => { setSent(false); setEmail(''); }}
                className="w-full px-6 py-3 border border-border rounded-xl hover:bg-accent/30 transition text-sm font-medium"
              >
                Essayer avec un autre email
              </button>
            </>
          )}

          <div className="mt-6 pt-5 border-t border-border text-center">
            <Link to="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition">
              <ArrowLeft className="w-4 h-4" />
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
