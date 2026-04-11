import { useState } from 'react';
import { MessageCircle, X, Send, CheckCircle, Headphones } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { contactApi } from '../../api/contact.api';
import { toast } from 'sonner';

export function FloatingChatWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Admins are the support team — hide for them
  if (user?.role === 'ADMIN') return null;

  const handleOpen = () => {
    setSent(false);
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveName = user ? user.name : name.trim();
    const effectiveEmail = user ? user.email : email.trim();
    const effectiveMessage = message.trim();
    if (!effectiveName || !effectiveEmail || !effectiveMessage) return;

    setSending(true);
    try {
      await contactApi.submit({
        name: effectiveName,
        email: effectiveEmail,
        subject: user ? `Message de ${user.name} (utilisateur connecté)` : 'Message visiteur',
        message: effectiveMessage,
      });
      setSent(true);
      setMessage('');
      setName('');
      setEmail('');
    } catch {
      toast.error("Impossible d'envoyer le message. Réessayez.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* ── Chat panel ── */}
      {open && (
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-80 overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Headphones className="w-5 h-5 text-white" />
              <div>
                <p className="text-white font-semibold text-sm leading-none">Support Iz Academy</p>
                <p className="text-indigo-200 text-xs mt-0.5">Nous répondons par email</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-white/70 hover:text-white transition-colors"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4">
            {sent ? (
              /* Success state */
              <div className="py-6 text-center">
                <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
                <p className="font-semibold text-gray-800">Message envoyé !</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Notre équipe vous répondra à l'adresse <strong>{user?.email ?? email}</strong>.
                </p>
                <button
                  onClick={() => setSent(false)}
                  className="mt-4 text-sm text-indigo-600 hover:underline"
                >
                  Envoyer un autre message
                </button>
              </div>
            ) : (
              /* Form */
              <form onSubmit={handleSubmit} className="space-y-3">
                {user ? (
                  /* Logged-in context banner */
                  <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2 text-xs text-indigo-700">
                    Connecté en tant que <strong>{user.name}</strong> — la réponse sera envoyée à{' '}
                    <strong>{user.email}</strong>.
                  </div>
                ) : (
                  /* Visitor fields */
                  <>
                    <input
                      type="text"
                      placeholder="Votre nom *"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
                    />
                    <input
                      type="email"
                      placeholder="Votre email *"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
                    />
                  </>
                )}

                <textarea
                  placeholder="Votre message…"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={4}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none transition"
                />

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg py-2 transition"
                >
                  <Send className="w-4 h-4" />
                  {sending ? 'Envoi en cours…' : 'Envoyer'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── Bubble button ── */}
      <button
        onClick={open ? handleClose : handleOpen}
        className="w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        aria-label={open ? 'Fermer le chat' : 'Ouvrir le chat support'}
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>
    </div>
  );
}
