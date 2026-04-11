import { useEffect, useRef, useState } from 'react';
import { TeacherLayout } from '../../components/TeacherLayout';
import { MessageSquare, Send, Search, Clock, Flag, X } from 'lucide-react';
import { messagesApi } from '../../../api/messages.api';
import { apiClient } from '../../../api/client';
import { useAuth } from '../../../context/AuthContext';

export function TeacherMessages() {
  const { user } = useAuth();
  const [allMessages, setAllMessages] = useState<any[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // ── Report state ─────────────────────────────────────────────────────────
  const [reportTarget, setReportTarget] = useState<{ id: string; content: string } | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportSending, setReportSending] = useState(false);
  const [reportedIds, setReportedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    messagesApi.getAll()
      .then(data => {
        setAllMessages(data);
        if (data.length > 0) {
          const first = data[0];
          const partnerId = first.senderId === user?.id ? first.receiverId : first.senderId;
          setSelectedPartnerId(partnerId);
          const hasUnread = (data as any[]).some(
            (m: any) => m.senderId === partnerId && m.receiverId === user?.id && !m.read,
          );
          if (hasUnread) {
            messagesApi.markAllRead(partnerId).catch(() => {});
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id]);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages, selectedPartnerId]);

  // Group messages into conversations by partner
  const conversationMap: Record<string, { partner: any; messages: any[]; unread: number }> = {};
  allMessages.forEach((msg: any) => {
    const partner = msg.senderId === user?.id ? msg.receiver : msg.sender;
    if (!partner) return;
    if (!conversationMap[partner.id]) {
      conversationMap[partner.id] = { partner, messages: [], unread: 0 };
    }
    conversationMap[partner.id].messages.push(msg);
    if (!msg.read && msg.receiverId === user?.id) conversationMap[partner.id].unread++;
  });
  const conversations = Object.values(conversationMap);

  const filteredConversations = conversations.filter(c =>
    c.partner.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentMessages = selectedPartnerId
    ? allMessages
        .filter((m: any) =>
          (m.senderId === user?.id && m.receiverId === selectedPartnerId) ||
          (m.senderId === selectedPartnerId && m.receiverId === user?.id)
        )
        .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    : [];

  const currentPartner = conversationMap[selectedPartnerId || '']?.partner;

  const handleSelectPartner = (partnerId: string) => {
    setSelectedPartnerId(partnerId);
    const hasUnread = allMessages.some(
      (m: any) => m.senderId === partnerId && m.receiverId === user?.id && !m.read,
    );
    if (hasUnread) {
      messagesApi.markAllRead(partnerId).catch(() => {});
      setAllMessages((prev) =>
        prev.map((m: any) =>
          m.senderId === partnerId && m.receiverId === user?.id ? { ...m, read: true } : m,
        ),
      );
    }
  };

  const handleReport = async () => {
    if (!reportTarget || !reportReason.trim() || reportSending) return;
    setReportSending(true);
    try {
      await apiClient('/reports', {
        method: 'POST',
        body: JSON.stringify({ reason: reportReason.trim(), messageId: reportTarget.id }),
      });
      setReportedIds((prev) => new Set(prev).add(reportTarget.id));
      setReportTarget(null);
      setReportReason('');
    } catch (err: any) {
      // Already reported — still close modal silently
      if (err?.status === 409) {
        setReportedIds((prev) => new Set(prev).add(reportTarget.id));
      }
      setReportTarget(null);
      setReportReason('');
    } finally {
      setReportSending(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {    e.preventDefault();
    if (!newMessage.trim() || !selectedPartnerId || sending) return;
    setSending(true);
    try {
      const sent = await messagesApi.send(selectedPartnerId, newMessage.trim());
      setAllMessages(prev => [...prev, {
        ...sent,
        sender: { id: user?.id, name: user?.name },
        receiver: currentPartner,
      }]);
      setNewMessage('');
    } catch {
      /* ignore */
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <TeacherLayout>
        <div className="flex items-center justify-center min-h-64">
          <p className="text-muted-foreground">Chargement…</p>
        </div>
      </TeacherLayout>
    );
  }

  if (conversations.length === 0) {
    return (
      <TeacherLayout>
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="mb-2">Messages</h1>
            <p className="text-muted-foreground">Communiquez avec vos étudiants</p>
          </div>
          <div className="bg-white border border-indigo-100 border-l-4 border-l-indigo-400 rounded-xl p-12 text-center shadow-sm">
            <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Aucun message</h2>
            <p className="text-muted-foreground">
              Vous n'avez pas encore reçu de messages de vos étudiants.
            </p>
          </div>
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="mb-2">Messages</h1>
          <p className="text-muted-foreground">Communiquez avec vos étudiants</p>
        </div>

        <div className="rounded-2xl overflow-hidden flex h-[calc(100vh-260px)] min-h-[500px] shadow-lg border border-indigo-100">

          {/* ── Sidebar ── */}
          <div className="w-full md:w-80 bg-gray-50 border-r border-gray-100 flex flex-col flex-shrink-0">

            {/* Gradient header */}
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-500 px-4 py-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-white font-semibold text-sm">Conversations</span>
                <span className="bg-white/20 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                  {conversations.length}
                </span>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-indigo-200" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher…"
                  className="w-full pl-8 pr-3 py-2 rounded-full text-sm bg-white/15 text-white placeholder-indigo-200 border border-white/20 focus:outline-none focus:bg-white/25"
                />
              </div>
            </div>

            {/* Contact list */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.map((conversation) => {
                const isSelected = selectedPartnerId === conversation.partner.id;
                const lastMsg = conversation.messages[conversation.messages.length - 1];
                return (
                  <button
                    key={conversation.partner.id}
                    onClick={() => handleSelectPartner(conversation.partner.id)}
                    className={`w-full px-4 py-3.5 flex items-center gap-3 transition-colors text-left border-b border-gray-100 border-l-4 ${
                      isSelected
                        ? 'bg-indigo-50 border-l-indigo-500'
                        : 'hover:bg-gray-100 border-l-transparent'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0 text-sm ${
                      isSelected ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-700'
                    }`}>
                      {conversation.partner.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`font-semibold text-sm truncate ${isSelected ? 'text-indigo-700' : 'text-gray-800'}`}>
                          {conversation.partner.name}
                        </span>
                        {lastMsg && (
                          <span className="text-[10px] text-gray-400 flex-shrink-0 ml-1">
                            {new Date(lastMsg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-xs text-gray-400 truncate">
                          {lastMsg?.content?.slice(0, 32)}…
                        </span>
                        {conversation.unread > 0 && (
                          <span className="ml-1 min-w-[18px] h-[18px] rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold px-1 flex-shrink-0">
                            {conversation.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Chat panel ── */}
          <div className="hidden md:flex flex-1 flex-col min-w-0 bg-white">

            {/* Header */}
            <div className="bg-white border-b border-gray-100 px-5 py-3.5 flex items-center gap-3 shadow-sm">
              {currentPartner ? (
                <>
                  <div className="relative">
                    <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                      {currentPartner.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-800">{currentPartner.name}</p>
                    <p className="text-xs text-emerald-500 font-medium">En ligne</p>
                  </div>
                </>
              ) : (
                <p className="text-gray-400 text-sm">Sélectionnez un étudiant</p>
              )}
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-[#f5f6fb]">
              {currentMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mb-3">
                    <MessageSquare className="w-8 h-8 text-indigo-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-500">
                    {currentPartner ? 'Démarrez la conversation' : 'Sélectionnez un étudiant'}
                  </p>
                  {currentPartner && (
                    <p className="text-xs text-gray-400 mt-1">avec {currentPartner.name}</p>
                  )}
                </div>
              ) : (
                currentMessages.map((message: any) => {
                  const isMine = message.senderId === user?.id;
                  const alreadyReported = reportedIds.has(message.id);
                  return (
                    <div key={message.id} className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
                      {!isMine && (
                        <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {currentPartner?.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className={`max-w-[65%] flex flex-col gap-0.5 ${isMine ? 'items-end' : 'items-start'}`}>
                        <div
                          className={`px-4 py-2.5 text-sm leading-relaxed ${
                            isMine
                              ? 'bg-indigo-600 text-white rounded-2xl rounded-br-md'
                              : 'bg-white text-gray-800 rounded-2xl rounded-bl-md shadow-sm border border-gray-100'
                          }`}
                        >
                          {message.content}
                        </div>
                        <div className={`text-[10px] text-gray-400 flex items-center gap-1.5 px-1 ${isMine ? 'justify-end' : ''}`}>
                          <Clock className="w-2.5 h-2.5" />
                          {new Date(message.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          {/* Report button — only on received messages */}
                          {!isMine && (
                            <button
                              onClick={() => setReportTarget({ id: message.id, content: message.content })}
                              disabled={alreadyReported}
                              title={alreadyReported ? 'Déjà signalé' : 'Signaler ce message'}
                              className={`ml-1 p-0.5 rounded transition ${
                                alreadyReported
                                  ? 'text-red-400 cursor-default'
                                  : 'text-gray-300 hover:text-red-400 hover:bg-red-50'
                              }`}
                            >
                              <Flag className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="bg-white border-t border-gray-100 px-4 py-3">
              <form
                onSubmit={handleSendMessage}
                className="flex items-center gap-3 bg-gray-50 rounded-full px-4 py-2 border border-gray-200 focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-200 transition"
              >
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={currentPartner ? `Message à ${currentPartner.name}…` : 'Sélectionnez un étudiant'}
                  disabled={!currentPartner || sending}
                  className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || !currentPartner || sending}
                  className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition disabled:opacity-40 flex-shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* ── Report modal ─────────────────────────────────────────────────── */}
      {reportTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="font-semibold text-base flex items-center gap-2">
                  <Flag className="w-4 h-4 text-red-500" />
                  Signaler un message
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Ce signalement sera transmis aux administrateurs.
                </p>
              </div>
              <button
                onClick={() => { setReportTarget(null); setReportReason(''); }}
                className="p-1 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Message preview */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 italic line-clamp-3">
              "{reportTarget.content}"
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium mb-1.5">Raison du signalement</label>
              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Ex: Contenu inapproprié, harcèlement, spam…"
                rows={3}
                maxLength={500}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
              />
              <p className="text-xs text-muted-foreground text-right mt-0.5">{reportReason.length}/500</p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setReportTarget(null); setReportReason(''); }}
                className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-gray-50 transition"
              >
                Annuler
              </button>
              <button
                onClick={handleReport}
                disabled={!reportReason.trim() || reportSending}
                className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-40 flex items-center gap-2"
              >
                <Flag className="w-3.5 h-3.5" />
                {reportSending ? 'Envoi…' : 'Signaler'}
              </button>
            </div>
          </div>
        </div>
      )}
    </TeacherLayout>
  );
}
