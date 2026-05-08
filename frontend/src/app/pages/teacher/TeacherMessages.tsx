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

  const [reportTarget, setReportTarget] = useState<{ id: string; content: string } | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportSending, setReportSending] = useState(false);
  const [reportedIds, setReportedIds] = useState<Set<string>>(new Set());

  // ─────────────────────────────────────────────
  // Avatar component (teacher + student unified)
  // ─────────────────────────────────────────────
  const Avatar = ({ u }: any) => {
    if (u?.avatarUrl) {
      return (
        <img
          src={u.avatarUrl}
          alt={u.name}
          className="w-9 h-9 rounded-full object-cover flex-shrink-0"
        />
      );
    }

    return (
      <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
        {u?.name?.charAt(0)?.toUpperCase() || '?'}
      </div>
    );
  };

  // ─────────────────────────────────────────────
  // Load messages
  // ─────────────────────────────────────────────
  useEffect(() => {
    messagesApi.getAll()
      .then(data => {
        setAllMessages(data);

        if (data.length > 0) {
          const first = data[0];
          const partnerId = first.senderId === user?.id ? first.receiverId : first.senderId;
          setSelectedPartnerId(partnerId);

          const hasUnread = data.some(
            (m: any) => m.senderId === partnerId && m.receiverId === user?.id && !m.read,
          );

          if (hasUnread) {
            messagesApi.markAllRead(partnerId).catch(() => {});
          }
        }
      })
      .finally(() => setLoading(false));
  }, [user?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages, selectedPartnerId]);

  // ─────────────────────────────────────────────
  // Conversations
  // ─────────────────────────────────────────────
  const conversationMap: Record<string, any> = {};

  allMessages.forEach((msg: any) => {
    const partner = msg.senderId === user?.id ? msg.receiver : msg.sender;
    if (!partner) return;

    if (!conversationMap[partner.id]) {
      conversationMap[partner.id] = { partner, messages: [], unread: 0 };
    }

    conversationMap[partner.id].messages.push(msg);

    if (!msg.read && msg.receiverId === user?.id) {
      conversationMap[partner.id].unread++;
    }
  });

  const conversations = Object.values(conversationMap);

  const filteredConversations = conversations.filter((c: any) =>
    c.partner.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentMessages = selectedPartnerId
    ? allMessages
        .filter((m: any) =>
          (m.senderId === user?.id && m.receiverId === selectedPartnerId) ||
          (m.senderId === selectedPartnerId && m.receiverId === user?.id)
        )
        .sort((a: any, b: any) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
    : [];

  const currentPartner = conversationMap[selectedPartnerId || '']?.partner;

  // ─────────────────────────────────────────────
  // Send message
  // ─────────────────────────────────────────────
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedPartnerId || sending) return;

    setSending(true);

    try {
      const sent = await messagesApi.send(selectedPartnerId, newMessage.trim());

      setAllMessages(prev => [
        ...prev,
        {
          ...sent,
          sender: { id: user?.id, name: user?.name, avatarUrl: user?.avatarUrl },
          receiver: currentPartner,
        },
      ]);

      setNewMessage('');
    } finally {
      setSending(false);
    }
  };

  // ─────────────────────────────────────────────
  // UI
  // ─────────────────────────────────────────────
  if (loading) {
    return (
      <TeacherLayout>
        <p className="text-center text-muted-foreground">Chargement...</p>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout>
      <div className="rounded-2xl overflow-hidden flex h-[calc(100vh-260px)] shadow-lg border">

        {/* ───────── SIDEBAR ───────── */}
        <div className="w-80 bg-gray-50 border-r flex flex-col">

          <div className="p-3 bg-indigo-600 text-white font-semibold">
            Conversations
          </div>

          <div className="p-2">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher..."
              className="w-full px-3 py-2 text-sm border rounded"
            />
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredConversations.map((c: any) => {
              const isActive = selectedPartnerId === c.partner.id;

              return (
                <button
                  key={c.partner.id}
                  onClick={() => setSelectedPartnerId(c.partner.id)}
                  className={`w-full flex items-center gap-3 p-3 border-b text-left ${
                    isActive ? 'bg-indigo-50' : ''
                  }`}
                >
                  <Avatar u={c.partner} />

                  <div className="flex-1">
                    <p className="text-sm font-semibold">{c.partner.name}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {c.messages[c.messages.length - 1]?.content}
                    </p>
                  </div>

                  {c.unread > 0 && (
                    <span className="bg-red-500 text-white text-xs px-2 rounded-full">
                      {c.unread}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ───────── CHAT ───────── */}
        <div className="flex-1 flex flex-col bg-white">

          {/* header */}
          <div className="p-3 border-b flex items-center gap-3">
            {currentPartner ? (
              <>
                <Avatar u={currentPartner} />
                <div>
                  <p className="font-semibold">{currentPartner.name}</p>
                  <p className="text-xs text-green-500">En ligne</p>
                </div>
              </>
            ) : (
              <p className="text-gray-400">Sélectionnez un étudiant</p>
            )}
          </div>

          {/* messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50">
            {currentMessages.map((m: any) => {
              const isMine = m.senderId === user?.id;

              const msgUser = isMine
                ? user
                : currentPartner;

              return (
                <div
                  key={m.id}
                  className={`flex gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}
                >
                  {!isMine && <Avatar u={msgUser} />}

                  <div
                    className={`px-3 py-2 rounded-xl text-sm max-w-xs ${
                      isMine
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white border'
                    }`}
                  >
                    {m.content}

                    <div className="text-[10px] mt-1 opacity-60 flex gap-1 items-center">
                      <Clock className="w-3 h-3" />
                      {new Date(m.createdAt).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>

                  {isMine && <Avatar u={msgUser} />}
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* input */}
          <form onSubmit={handleSendMessage} className="p-3 border-t flex gap-2">
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 border rounded px-3 py-2 text-sm"
              placeholder="Écrire un message..."
            />
            <button className="bg-indigo-600 text-white px-4 rounded">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </TeacherLayout>
  );
}