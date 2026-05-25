import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { GraduationCap, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { authApi } from '../../api/auth.api';

type Status = 'loading' | 'success' | 'error';

export function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<Status>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setErrorMsg('Lien de vérification invalide.');
      setStatus('error');
      return;
    }
    authApi.verifyEmail(token)
      .then(() => setStatus('success'))
      .catch((err: any) => {
        setErrorMsg(err.message || 'Échec de la vérification.');
        setStatus('error');
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-accent/30 p-8">
      <div className="w-full max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-8">
          <GraduationCap className="w-10 h-10 text-primary" />
          <span className="font-semibold text-2xl">Iz Solution</span>
        </Link>

        <div className="bg-white border border-border rounded-xl p-10">
          {status === 'loading' && (
            <>
              <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
              <h1 className="text-xl font-semibold">Vérification en cours...</h1>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="flex justify-center mb-6">
                <CheckCircle className="w-16 h-16 text-green-500" />
              </div>
              <h1 className="text-2xl font-semibold mb-3">Email vérifié !</h1>
              <p className="text-muted-foreground mb-8">
                Votre compte est maintenant actif. Vous pouvez vous connecter.
              </p>
              <Link
                to="/login"
                className="inline-block w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition font-medium"
              >
                Se connecter
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="flex justify-center mb-6">
                <XCircle className="w-16 h-16 text-destructive" />
              </div>
              <h1 className="text-2xl font-semibold mb-3">Vérification échouée</h1>
              <p className="text-muted-foreground mb-8">{errorMsg}</p>
              <Link
                to="/register"
                className="inline-block w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition font-medium"
              >
                Créer un nouveau compte
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
