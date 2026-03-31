import { useEffect, useMemo, useState } from 'react';
import { Mail, MailCheck, Reply, Send, User } from 'lucide-react';
import { toast } from 'sonner';
import { AdminLayout } from '../../components/AdminLayout';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { contactApi, type ContactMessage } from '../../../api/contact.api';

export function AdminContactMessages() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [sending, setSending] = useState(false);

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
    if (!trimmed) {
      toast.error('La réponse ne peut pas être vide');
      return;
    }

    try {
      setSending(true);
      const updated = await contactApi.reply(selectedMessage.id, trimmed);
      setMessages((current) => current.map((message) => (
        message.id === updated.id ? updated : message
      )));
      setReplyMessage(updated.replyMessage || '');
      toast.success('Réponse envoyée par email');
    } catch {
      toast.error('Impossible d\'envoyer la réponse');
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    setReplyMessage(selectedMessage?.replyMessage || '');
  }, [selectedMessage?.id]);

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="mb-2">Messages de contact</h1>
          <p className="text-muted-foreground">Consultez les demandes envoyées depuis la page d'accueil et répondez par email.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <Card>
            <CardHeader>
              <CardTitle>Boîte de réception</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <div className="text-sm text-muted-foreground">Chargement...</div>
              ) : messages.length === 0 ? (
                <div className="text-sm text-muted-foreground">Aucun message pour le moment.</div>
              ) : messages.map((message) => (
                <button
                  key={message.id}
                  type="button"
                  onClick={() => setSelectedId(message.id)}
                  className={`w-full rounded-xl border p-4 text-left transition ${selectedId === message.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent/50'}`}
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="font-medium truncate">{message.subject}</div>
                    <Badge variant={message.repliedAt ? 'default' : 'secondary'}>
                      {message.repliedAt ? 'Répondu' : message.isRead ? 'Lu' : 'Nouveau'}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground truncate">{message.name} • {message.email}</div>
                  <div className="mt-2 line-clamp-2 text-sm text-muted-foreground">{message.message}</div>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Détail et réponse</CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedMessage ? (
                <div className="text-sm text-muted-foreground">Sélectionnez un message pour le consulter.</div>
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant={selectedMessage.repliedAt ? 'default' : 'secondary'}>
                      {selectedMessage.repliedAt ? <MailCheck className="mr-1 h-3 w-3" /> : <Mail className="mr-1 h-3 w-3" />}
                      {selectedMessage.repliedAt ? 'Répondu' : 'En attente'}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Reçu le {new Date(selectedMessage.createdAt).toLocaleString('fr-FR')}
                    </span>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-border p-4">
                      <div className="mb-2 flex items-center gap-2 font-medium"><User className="h-4 w-4" /> Expéditeur</div>
                      <div>{selectedMessage.name}</div>
                      <div className="text-sm text-muted-foreground">{selectedMessage.email}</div>
                    </div>
                    <div className="rounded-xl border border-border p-4">
                      <div className="mb-2 flex items-center gap-2 font-medium"><Reply className="h-4 w-4" /> Sujet</div>
                      <div>{selectedMessage.subject}</div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border p-4">
                    <div className="mb-2 font-medium">Message reçu</div>
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">{selectedMessage.message}</p>
                  </div>

                  <div className="space-y-3">
                    <label htmlFor="replyMessage" className="block font-medium">Réponse par email</label>
                    <textarea
                      id="replyMessage"
                      value={replyMessage}
                      onChange={(event) => setReplyMessage(event.target.value)}
                      rows={8}
                      placeholder="Rédigez la réponse qui sera envoyée à l'expéditeur..."
                      className="w-full rounded-xl border border-border bg-input-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-sm text-muted-foreground">
                        {selectedMessage.repliedAt
                          ? `Dernière réponse envoyée le ${new Date(selectedMessage.repliedAt).toLocaleString('fr-FR')}`
                          : 'Aucune réponse envoyée pour le moment.'}
                      </div>
                      <Button onClick={handleReply} disabled={sending}>
                        <Send className="mr-2 h-4 w-4" />
                        {sending ? 'Envoi...' : selectedMessage.repliedAt ? 'Renvoyer la réponse' : 'Envoyer la réponse'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}