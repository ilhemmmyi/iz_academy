import { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import {
  User,
  Mail,
  Save,
  LogOut,
  ArrowLeft,
  Camera,
  Trash2,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Phone,
  MapPin,
  GraduationCap,
  Briefcase,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usersApi } from '../../api/users.api';
import { toast } from 'sonner';

const PASSWORD_RULES = [
  { label: '8 caractères minimum', test: (p: string) => p.length >= 8 },
  { label: 'Une lettre majuscule',  test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Une lettre minuscule',  test: (p: string) => /[a-z]/.test(p) },
  { label: 'Un chiffre',            test: (p: string) => /\d/.test(p) },
  { label: 'Un caractère spécial',  test: (p: string) => /[!@#$%^&*()\-_=+\[\]{};':"\\|,.<>/?]/.test(p) },
];

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

  // personal info (students only)
  const [phone,          setPhone]          = useState(user?.phone          || '');
  const [address,        setAddress]        = useState(user?.address        || '');
  const [educationLevel, setEducationLevel] = useState(user?.educationLevel || '');
  const [studentStatus,  setStudentStatus]  = useState(user?.studentStatus  || '');
  const [savingInfo,     setSavingInfo]     = useState(false);

  // avatar states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarDeleting, setAvatarDeleting] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);

  // password change states
  const [pwCurrent, setPwCurrent]         = useState('');
  const [pwNew, setPwNew]                 = useState('');
  const [pwConfirm, setPwConfirm]         = useState('');
  const [showPwCurrent, setShowPwCurrent] = useState(false);
  const [showPwNew, setShowPwNew]         = useState(false);
  const [savingPw, setSavingPw]           = useState(false);

  if (!user) {
    navigate('/login');
    return null;
  }

  /* =========================
     SAVE NAME
  ========================= */
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

  /* =========================
     SAVE PERSONAL INFO
  ========================= */
  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingInfo(true);
    try {
      const updated = await usersApi.updateMe({ phone: phone.trim(), address: address.trim(), educationLevel, studentStatus });
      setUser({ ...user, phone: updated.phone, address: updated.address, educationLevel: updated.educationLevel, studentStatus: updated.studentStatus });
      toast.success('Informations personnelles mises à jour');
    } catch {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setSavingInfo(false);
    }
  };

  /* =========================
     CHANGE / SET PASSWORD
  ========================= */
  const hasLocalPassword = user.hasPassword;
  const allRulesPassed = PASSWORD_RULES.every(r => r.test(pwNew));
  const passwordsMatch = pwNew === pwConfirm && pwConfirm.length > 0;
  const sameAsOld = hasLocalPassword && pwCurrent.length > 0 && pwNew === pwCurrent;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allRulesPassed || !passwordsMatch) return;
    if (hasLocalPassword && !pwCurrent) return;
    if (sameAsOld) return;
    setSavingPw(true);
    try {
      await usersApi.changePassword({
        ...(hasLocalPassword ? { currentPassword: pwCurrent } : {}),
        newPassword: pwNew,
      });
      setPwCurrent(''); setPwNew(''); setPwConfirm('');
      if (!hasLocalPassword) {
        // Google user just set a local password — update context immediately
        // so the form switches to "change" mode without requiring a page refresh
        setUser({ ...user, hasPassword: true });
        toast.success('Mot de passe défini avec succès. Vous pouvez maintenant vous connecter avec votre email.');
      } else {
        toast.success('Mot de passe modifié avec succès.');
      }
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('incorrect') || msg.includes('Mot de passe actuel incorrect')) {
        toast.error('Mot de passe actuel incorrect.');
      } else if (msg.includes('requis') || msg.includes('required')) {
        toast.error('Le mot de passe actuel est requis.');
      } else if (msg.includes('différent') || msg.includes('differ')) {
        toast.error('Le nouveau mot de passe doit être différent de l\'ancien.');
      } else {
        toast.error('Erreur lors du changement de mot de passe.');
      }
    } finally {
      setSavingPw(false);
    }
  };

  /* =========================
     AVATAR UPLOAD
  ========================= */
  const handleAvatarChange = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Only images are allowed');
      return;
    }
    setAvatarUploading(true);
    try {
      const updated = await usersApi.updateAvatar(file);
      setUser({ ...user, avatarUrl: updated.avatarUrl });
      toast.success('Photo de profil mise à jour');
    } catch (err: any) {
      toast.error(err.message || 'Erreur upload avatar');
    } finally {
      setAvatarUploading(false);
    }
  };

  /* =========================
     AVATAR DELETE
  ========================= */
  const handleAvatarDelete = async () => {
    setAvatarDeleting(true);
    try {
      await usersApi.deleteAvatar();
      setAvatarPreview(null);
      setUser({ ...user, avatarUrl: undefined });
      toast.success('Photo de profil supprimée');
    } catch {
      toast.error('Erreur lors de la suppression de la photo');
    } finally {
      setAvatarDeleting(false);
    }
  };

  /* =========================
     LOGOUT
  ========================= */
  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="flex-1 py-12 px-4 bg-accent/30">
        <div className="max-w-lg mx-auto space-y-6">

          {/* Back */}
          <button
            onClick={() => navigate(getDashboardPath(user.role))}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au tableau de bord
          </button>

          <h1 className="text-2xl font-bold">Mon profil</h1>

          {/* =========================
              AVATAR BLOCK (FIXED)
          ========================= */}
          <div className="bg-white border border-indigo-100 border-l-4 border-l-indigo-400 rounded-xl p-6 flex items-center gap-5 shadow-sm">

            <div className="relative w-16 h-16">

              {/* Avatar */}
              {user.avatarUrl || avatarPreview ? (
                <img
                  src={avatarPreview || user.avatarUrl}
                  alt={user.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className={`w-16 h-16 rounded-full ${getRoleAvatarColor(user.role)} text-white flex items-center justify-center text-2xl font-bold`}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Camera button — opens menu if avatar exists, else opens file picker directly */}
              <button
                type="button"
                onClick={() => {
                  if (avatarUploading || avatarDeleting) return;
                  if (user.avatarUrl || avatarPreview) {
                    setAvatarMenuOpen((v) => !v);
                  } else {
                    fileInputRef.current?.click();
                  }
                }}
                className="absolute bottom-0 right-0 bg-black/70 text-white p-1.5 rounded-full hover:bg-black transition disabled:opacity-50"
                disabled={avatarUploading || avatarDeleting}
              >
                <Camera className="w-3.5 h-3.5" />
              </button>

              {/* Dropdown menu */}
              {avatarMenuOpen && (
                <>
                  {/* overlay to close on outside click */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setAvatarMenuOpen(false)}
                  />
                  <div className="absolute bottom-8 right-0 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[140px]">
                    <button
                      type="button"
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                      onClick={() => { setAvatarMenuOpen(false); fileInputRef.current?.click(); }}
                    >
                      <Camera className="w-3.5 h-3.5" />
                      Modifier la photo
                    </button>
                    <button
                      type="button"
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                      onClick={() => { setAvatarMenuOpen(false); handleAvatarDelete(); }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Supprimer la photo
                    </button>
                  </div>
                </>
              )}

              {/* hidden input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  if (file) {
                    setAvatarPreview(URL.createObjectURL(file));
                    handleAvatarChange(file);
                  }
                }}
              />
            </div>

            {/* User info */}
            <div>
              <p className="font-semibold text-lg">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>

              <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-xs font-medium">
                {user.role === 'STUDENT'
                  ? 'Étudiant'
                  : user.role === 'TEACHER'
                  ? 'Formateur'
                  : 'Administrateur'}
              </span>
            </div>
          </div>

          {/* =========================
              EDIT FORM
          ========================= */}
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
                <p className="text-xs text-muted-foreground mt-1">
                  L'adresse e-mail ne peut pas être modifiée.
                </p>
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

          {/* =========================
              PERSONAL INFO (students)
          ========================= */}
          {user.role === 'STUDENT' && (
            <div className="bg-white border border-indigo-100 border-l-4 border-l-indigo-300 rounded-xl p-6 shadow-sm">
              <h2 className="font-semibold mb-1">Informations personnelles</h2>
              <p className="text-xs text-muted-foreground mb-5">
                Ces données sont utilisées pour vos demandes d'inscription aux formations.
              </p>

              <form onSubmit={handleSaveInfo} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Numéro de téléphone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="Ex : 55 123 456"
                      maxLength={30}
                      className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Adresse</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      placeholder="Ex : 12 Rue des Fleurs, Tunis"
                      maxLength={200}
                      className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Niveau scolaire</label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <select
                      value={educationLevel}
                      onChange={e => setEducationLevel(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-primary text-sm appearance-none"
                    >
                      <option value="">Sélectionner...</option>
                      <option value="Bac">Bac</option>
                      <option value="Bac+2">Bac+2</option>
                      <option value="Bac+3">Bac+3</option>
                      <option value="Bac+4">Bac+4</option>
                      <option value="Bac+5 et plus">Bac+5 et plus</option>
                      <option value="Autre">Autre</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Statut</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <select
                      value={studentStatus}
                      onChange={e => setStudentStatus(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-primary text-sm appearance-none"
                    >
                      <option value="">Sélectionner...</option>
                      <option value="Étudiant">Étudiant</option>
                      <option value="Employé">Employé</option>
                      <option value="Autre">Autre</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingInfo}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition disabled:opacity-50 font-medium"
                >
                  <Save className="w-4 h-4" />
                  {savingInfo ? 'Enregistrement…' : 'Enregistrer les informations'}
                </button>
              </form>
            </div>
          )}

          {/* =========================
              CHANGE / SET PASSWORD
          ========================= */}
          <div className="bg-white border border-indigo-100 border-l-4 border-l-indigo-300 rounded-xl p-6 shadow-sm">
            <h2 className="font-semibold mb-1 flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-500" />
              {hasLocalPassword ? 'Changer mon mot de passe' : 'Définir un mot de passe'}
            </h2>
            {!hasLocalPassword && (
              <p className="text-xs text-muted-foreground mb-4">
                Votre compte utilise Google. Vous pouvez définir un mot de passe local pour vous connecter également par email.
              </p>
            )}
            {hasLocalPassword && <div className="mb-5" />}
            <form onSubmit={handleChangePassword} className="space-y-4">
              {/* Current password — only for users who already have a local password */}
              {hasLocalPassword && (
                <div>
                  <label className="block text-sm font-medium mb-1.5">Mot de passe actuel</label>
                  <div className="relative">
                    <input
                      type={showPwCurrent ? 'text' : 'password'}
                      value={pwCurrent}
                      onChange={e => setPwCurrent(e.target.value)}
                      placeholder="Votre mot de passe actuel"
                      className="w-full px-3 py-2.5 pr-10 border border-border rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                      required
                    />
                    <button type="button" onClick={() => setShowPwCurrent(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPwCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* New password */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Nouveau mot de passe</label>
                <div className="relative">
                  <input
                    type={showPwNew ? 'text' : 'password'}
                    value={pwNew}
                    onChange={e => setPwNew(e.target.value)}
                    placeholder="Nouveau mot de passe fort"
                    className="w-full px-3 py-2.5 pr-10 border border-border rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    required
                  />
                  <button type="button" onClick={() => setShowPwNew(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPwNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {pwNew.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {PASSWORD_RULES.map(r => {
                      const ok = r.test(pwNew);
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
                <label className="block text-sm font-medium mb-1.5">Confirmer le nouveau mot de passe</label>
                <input
                  type="password"
                  value={pwConfirm}
                  onChange={e => setPwConfirm(e.target.value)}
                  placeholder="Répétez le nouveau mot de passe"
                  className={`w-full px-3 py-2.5 border rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-primary text-sm ${
                    pwConfirm.length > 0 ? (passwordsMatch ? 'border-green-400' : 'border-red-400') : 'border-border'
                  }`}
                  required
                />
                {pwConfirm.length > 0 && !passwordsMatch && (
                  <p className="text-xs text-red-500 mt-1">Les mots de passe ne correspondent pas.</p>
                )}
              </div>

              {sameAsOld && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5 shrink-0" />
                  Le nouveau mot de passe doit être différent de l'ancien.
                </p>
              )}
              <button
                type="submit"
                disabled={(hasLocalPassword && !pwCurrent) || !allRulesPassed || !passwordsMatch || sameAsOld || savingPw}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition disabled:opacity-50 font-medium text-sm"
              >
                <Lock className="w-4 h-4" />
                {savingPw ? 'Enregistrement…' : hasLocalPassword ? 'Changer le mot de passe' : 'Définir le mot de passe'}
              </button>
            </form>
          </div>

          {/* =========================
              LOGOUT
          ========================= */}
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
