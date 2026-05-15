import { useEffect, useMemo, useState } from 'react';
import { Mail, MailCheck, Send, Inbox, Clock, CheckCheck, User, AtSign, MessageSquare, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { AdminLayout } from '../../components/AdminLayout';
import { contactApi, type ContactMessage } from '../../../api/contact.api';

const PAGE_SIZE = 5;

export function AdminContactMessages() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    contactApi.getAll()
      .then((data) => {
        setMessages(data);
        if (data[0]) setSelectedId(data[0].id);
      })
      .catch(() => toast.error('Impossible de charger les messages de contact'))
      .finally(() => setLoading(false));
  }, []);

  const selectedMessage = useMemo(
    () => messages.find((message) => message.id === selectedId) ?? null,
    [messages, selectedId],
  );

  useEffect(() => {
    if (!selectedMessage || selectedMessage.isRead) return;
    contactApi.markRead(selectedMessage.id)
      .then(() => {
        setMessages((current) => current.map((message) => (
          message.id === selectedMessage.id ? { ...message, isRead: true } : message
        )));
      })
      .catch(() => {});
  }, [selectedMessage]);

  const handleReply = async () => {
    if (!selectedMessage) return;
    const trimmed = replyMessage.trim();
    if (!trimmed) { toast.error('La réponse ne peut pas être vide'); return; }
    try {
      setSending(true);
      const updated = await contactApi.reply(selectedMessage.id, trimmed);
      setMessages((current) => current.map((message) => (
        message.id === updated.id ? updated : message
      )));
      setReplyMessage(updated.replyMessage || '');
      toast.success('Réponse envoyée par email');
    } catch {
      toast.error("Impossible d'envoyer la réponse");
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    setReplyMessage(selectedMessage?.replyMessage || '');
  }, [selectedMessage?.id]);

  const unread = messages.filter(m => !m.isRead).length;
  const replied = messages.filter(m => m.repliedAt).length;
  const visibleMessages = messages.slice(0, visibleCount);
  const hasMore = visibleCount < messages.length;

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="mb-1">Messages de contact</h1>
            <p className="text-muted-foreground text-sm">Gérez les demandes et répondez directement par email.</p>
          </div>
          <div className="flex gap-3">
            <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-700 px-4 py-2 rounded-xl text-sm font-medium">
              <Clock className="w-4 h-4" />
              {unread} non lu{unread !== 1 ? 's' : ''}
            </div>
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-xl text-sm font-medium">
              <CheckCheck className="w-4 h-4" />
              {replied} répondu{replied !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Main layout — fixed height, both panels scroll independently */}
        <div
          className="grid lg:grid-cols-[340px_1fr] gap-0 bg-white border border-border rounded-2xl overflow-hidden shadow-sm"
          style={{ height: 'calc(100vh - 220px)', minHeight: '500px' }}
        >
          {/* Left panel — inbox with independent scroll */}
          <div className="border-r border-border flex flex-col overflow-hidden">
            <div className="flex-shrink-0 px-4 py-4 border-b border-border bg-accent/30">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <Inbox className="w-4 h-4" />
                Boîte de réception
                {unread > 0 && (
                  <span className="ml-auto bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">{unread}</span>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-border">
              {loading ? (
                <div className="p-6 text-center text-sm text-muted-foreground">Chargement...</div>
              ) : messages.length === 0 ? (
                <div className="p-8 text-center">
                  <Mail className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">Aucun message pour le moment.</p>
                </div>
              ) : (
                <>
                  {visibleMessages.map((message) => (
                    <button
                      key={message.id}
                      type="button"
                      onClick={() => setSelectedId(message.id)}
                      className={`w-full px-4 py-4 text-left transition-colors ${
                        selectedId === message.id
                          ? 'bg-primary/5 border-l-2 border-l-primary'
                          : 'hover:bg-accent/40 border-l-2 border-l-transparent'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className={`text-sm truncate ${!message.isRead ? 'font-semibold' : 'font-medium'}`}>
                          {message.name}
                        </span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                          {new Date(message.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                      <div className={`text-xs mb-1 truncate ${!message.isRead ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                        {message.subject}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground line-clamp-1">{message.message}</span>
                        {message.repliedAt ? (
                          <span className="flex-shrink-0 inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            <MailCheck className="w-3 h-3" /> Répondu
                          </span>
                        ) : !message.isRead ? (
                          <span className="flex-shrink-0 w-2 h-2 rounded-full bg-primary" />
                        ) : null}
                      </div>
                    </button>
                  ))}
                  {hasMore && (
                    <button
                      type="button"
                      onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                      className="w-full px-4 py-3 flex items-center justify-center gap-2 text-sm text-primary font-medium hover:bg-accent/40 transition"
                    >
                      <ChevronDown className="w-4 h-4" />
                      Voir plus ({messages.length - visibleCount} restants)
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right panel — message detail + sticky reply */}
          <div className="flex flex-col overflow-hidden">
            {!selectedMessage ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground p-8">
                <MessageSquare className="w-12 h-12 opacity-30" />
                <p className="text-sm">Sélectionnez un message pour le lire</p>
              </div>
            ) : (
              <>
                {/* Message header — fixed */}
                <div className="flex-shrink-0 px-6 py-5 border-b border-border">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h2 className="text-lg font-semibold leading-tight">{selectedMessage.subject}</h2>
                    {selectedMessage.repliedAt ? (
                      <span className="flex-shrink-0 inline-flex items-center gap-1.5 text-xs bg-green-100 text-green-700 border border-green-200 px-3 py-1 rounded-full font-medium">
                        <MailCheck className="w-3.5 h-3.5" /> Répondu
                      </span>
                    ) : (
                      <span className="flex-shrink-0 inline-flex items-center gap-1.5 text-xs bg-orange-50 text-orange-600 border border-orange-200 px-3 py-1 rounded-full font-medium">
                        <Clock className="w-3.5 h-3.5" /> En attente
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" /> {selectedMessage.name}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <AtSign className="w-3.5 h-3.5" /> {selectedMessage.email}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(selectedMessage.createdAt).toLocaleString('fr-FR')}
                    </span>
                  </div>
                </div>

                {/* Message body — scrollable */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 min-h-0">
                  <div className="bg-accent/30 rounded-xl p-5">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{selectedMessage.message}</p>
                  </div>

                  {selectedMessage.repliedAt && selectedMessage.replyMessage && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                      <div className="flex items-center gap-2 text-xs font-medium text-green-700 mb-2">
                        <MailCheck className="w-3.5 h-3.5" />
                        Votre réponse — envoyée le {new Date(selectedMessage.repliedAt).toLocaleString('fr-FR')}
                      </div>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap text-green-900">{selectedMessage.replyMessage}</p>
                    </div>
                  )}
                </div>

                {/* Reply area — sticky at bottom, never scrolls away */}
                <div className="flex-shrink-0 border-t border-border px-6 py-4 bg-white">
                  <label className="block text-sm font-medium mb-2">
                    {selectedMessage.repliedAt ? 'Envoyer une nouvelle réponse' : 'Répondre par email'}
                  </label>
                  <textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleReply(); }}
                    rows={3}
                    placeholder="Rédigez votre réponse..."
                    className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-muted-foreground">
                      {selectedMessage.repliedAt
                        ? `Dernière réponse : ${new Date(selectedMessage.repliedAt).toLocaleString('fr-FR')}`
                        : 'La réponse sera envoyée à ' + selectedMessage.email}
                    </span>
                    <button
                      onClick={handleReply}
                      disabled={sending || !replyMessage.trim()}
                      className="inline-flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition disabled:opacity-60"
                    >
                      <Send className="w-4 h-4" />
                      {sending ? 'Envoi...' : selectedMessage.repliedAt ? 'Renvoyer' : 'Envoyer'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
