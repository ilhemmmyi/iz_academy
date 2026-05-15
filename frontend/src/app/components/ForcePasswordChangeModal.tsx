import { useState } from 'react';
import { Lock, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { usersApi } from '../../api/users.api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

const RULES = [
  { label: '8 caractères minimum', test: (p: string) => p.length >= 8 },
  { label: 'Une lettre majuscule', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Une lettre minuscule', test: (p: string) => /[a-z]/.test(p) },
  { label: 'Un chiffre',           test: (p: string) => /\d/.test(p) },
  { label: 'Un caractère spécial', test: (p: string) => /[!@#$%^&*()\-_=+\[\]{};':"\\|,.<>/?]/.test(p) },
];

export function ForcePasswordChangeModal() {
  const { user, setUser } = useAuth();
  const [current, setCurrent]       = useState('');
  const [next, setNext]             = useState('');
  const [confirm, setConfirm]       = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext]     = useState(false);
  const [loading, setLoading]       = useState(false);

  if (!user?.mustChangePassword) return null;

  const allRulesPassed = RULES.every(r => r.test(next));
  const passwordsMatch = next === confirm && confirm.length > 0;
  const canSubmit = current.length > 0 && allRulesPassed && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    try {
      await usersApi.changePassword({ currentPassword: current, newPassword: next });
      setUser({ ...user, mustChangePassword: false });
      toast.success('Mot de passe mis à jour avec succès !');
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('incorrect') || msg.includes('Current')) {
        toast.error('Mot de passe actuel incorrect.');
      } else {
        toast.error('Erreur lors du changement de mot de passe.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">Changement de mot de passe requis</h2>
              <p className="text-amber-100 text-sm">Vous devez définir un nouveau mot de passe pour continuer.</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Current password */}
          <div>
            <label className="block text-sm font-medium mb-1">Mot de passe temporaire actuel</label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={current}
                onChange={e => setCurrent(e.target.value)}
                placeholder="Mot de passe fourni par l'admin"
                className="w-full px-3 py-2.5 pr-10 border border-border rounded-xl bg-accent/20 focus:outline-none focus:ring-2 focus:ring-amber-400"
                required
              />
              <button type="button" onClick={() => setShowCurrent(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New password */}
          <div>
            <label className="block text-sm font-medium mb-1">Nouveau mot de passe</label>
            <div className="relative">
              <input
                type={showNext ? 'text' : 'password'}
                value={next}
                onChange={e => setNext(e.target.value)}
                placeholder="Choisissez un mot de passe fort"
                className="w-full px-3 py-2.5 pr-10 border border-border rounded-xl bg-accent/20 focus:outline-none focus:ring-2 focus:ring-amber-400"
                required
              />
              <button type="button" onClick={() => setShowNext(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showNext ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Rules checklist */}
            {next.length > 0 && (
              <ul className="mt-2 space-y-1">
                {RULES.map(r => {
                  const ok = r.test(next);
                  return (
                    <li key={r.label} className={`flex items-center gap-1.5 text-xs ${ok ? 'text-green-600' : 'text-red-500'}`}>
                      {ok ? <CheckCircle className="w-3.5 h-3.5 shrink-0" /> : <XCircle className="w-3.5 h-3.5 shrink-0" />}
                      {r.label}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Confirm */}
          <div>
            <label className="block text-sm font-medium mb-1">Confirmer le nouveau mot de passe</label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Répétez le nouveau mot de passe"
              className={`w-full px-3 py-2.5 border rounded-xl bg-accent/20 focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                confirm.length > 0 ? (passwordsMatch ? 'border-green-400' : 'border-red-400') : 'border-border'
              }`}
              required
            />
            {confirm.length > 0 && !passwordsMatch && (
              <p className="text-xs text-red-500 mt-1">Les mots de passe ne correspondent pas.</p>
            )}
          </div>

          <button
            type="submit"
            disabled={!canSubmit || loading}
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Enregistrement…' : 'Changer le mot de passe'}
          </button>
        </form>
      </div>
    </div>
  );
}
