import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { User, Mail, Save, LogOut, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usersApi } from '../../api/users.api';
import { toast } from 'sonner';

function getDashboardPath(role: string) {
  if (role === 'TEACHER') return '/teacher';
  if (role === 'ADMIN') return '/admin';
  return '/student';
}

function getRoleAvatarColor(role: string) {
  if (role === 'TEACHER') return 'bg-teal-500';
  if (role === 'ADMIN') return 'bg-violet-500';
  return 'bg-indigo-500';
}

export function UserProfile() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Le nom ne peut pas être vide');
      return;
    }
    setSaving(true);
    try {
      const updated = await usersApi.updateMe({ name: name.trim() });
      setUser({ ...user, name: updated.name });
      toast.success('Profil mis à jour avec succès');
    } catch {
      toast.error('Erreur lors de la mise à jour du profil');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="flex-1 py-12 px-4 bg-accent/30">
        <div className="max-w-lg mx-auto space-y-6">

          {/* Back link */}
          <button
            onClick={() => navigate(getDashboardPath(user.role))}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au tableau de bord
          </button>

          <h1 className="text-2xl font-bold">Mon profil</h1>

          {/* Avatar + name card */}
          <div className="bg-white border border-indigo-100 border-l-4 border-l-indigo-400 rounded-xl p-6 flex items-center gap-5 shadow-sm">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <div className={`w-16 h-16 rounded-full ${getRoleAvatarColor(user.role)} text-white flex items-center justify-center text-2xl font-bold`}>
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-semibold text-lg">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-xs font-medium">
                {user.role === 'STUDENT' ? 'Étudiant' : user.role === 'TEACHER' ? 'Formateur' : 'Administrateur'}
              </span>
            </div>
          </div>

          {/* Edit form */}
          <div className="bg-white border border-indigo-100 border-l-4 border-l-indigo-300 rounded-xl p-6 shadow-sm">
            <h2 className="font-semibold mb-5">Modifier mes informations</h2>
            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1.5">Nom complet</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    placeholder="Votre nom"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Adresse e-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg bg-accent text-muted-foreground text-sm cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">L'adresse e-mail ne peut pas être modifiée.</p>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition disabled:opacity-50 font-medium"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Enregistrement…' : 'Enregistrer les modifications'}
              </button>
            </form>
          </div>

          {/* Logout */}
          <div className="bg-white border border-border rounded-xl p-6 shadow-sm">
            <h2 className="font-semibold mb-2">Session</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Vous êtes connecté en tant que <strong>{user.name}</strong>.
            </p>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              Se déconnecter
            </button>
          </div>

        </div>
      </div>

      <Footer />
    </div>
  );
}
