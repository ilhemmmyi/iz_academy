import { Link, useLocation } from 'react-router';
import { Mail } from 'lucide-react';

export function CheckEmail() {
  const location = useLocation();
  const email = (location.state as any)?.email as string | undefined;

  return (
    <div className="min-h-screen flex items-center justify-center bg-accent/30 p-8">
      <div className="w-full max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-8">
          <img src="/iz-logo.png" alt="IZ Academy" className="h-10 w-auto" />
              <span className="font-semibold text-2xl">IZ Academy</span>
        </Link>

        <div className="bg-white border border-border rounded-xl p-10">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail className="w-8 h-8 text-primary" />
            </div>
          </div>

          <h1 className="text-2xl font-semibold mb-3">Vérifiez votre email</h1>

          <p className="text-muted-foreground mb-2">
            Un lien de vérification a été envoyé à
          </p>
          {email && (
            <p className="font-semibold text-foreground mb-6">{email}</p>
          )}

          <p className="text-sm text-muted-foreground mb-8">
            Cliquez sur le lien dans l'email pour activer votre compte.
            Le lien expirera dans <strong>24 heures</strong>.
          </p>

          <p className="text-sm text-muted-foreground">
            Vérifiez aussi votre dossier spam si vous ne voyez pas l'email.
          </p>

          <div className="mt-8 pt-6 border-t border-border text-sm text-muted-foreground">
            Déjà un compte ?{' '}
            <Link to="/login" className="text-primary hover:underline">
              Se connecter
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
