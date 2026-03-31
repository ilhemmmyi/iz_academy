import { useEffect, useRef, useState } from 'react';
import { StudentLayout } from '../../components/StudentLayout';
import { MessageSquare, Search, Send, Clock, BookOpen } from 'lucide-react';
import { messagesApi } from '../../../api/messages.api';
import { useAuth } from '../../../context/AuthContext';

interface Contact {
  id: string;
  name: string;
  avatarUrl: string | null;
  courseTitle: string;
  courseId: string;
}

export function StudentMessages() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [allMessages, setAllMessages] = useState<any[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load contacts (enrolled teachers) + all messages in parallel
  useEffect(() => {
    Promise.all([messagesApi.getContacts(), messagesApi.getAll()])
      .then(([ctcts, msgs]) => {
        setContacts(ctcts as Contact[]);
        setAllMessages(msgs as any[]);
        if ((ctcts as Contact[]).length > 0 && !selectedContact) {
          setSelectedContact((ctcts as Contact[])[0]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages, selectedContact]);

  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const currentMessages = selectedContact
    ? [...allMessages]
        .filter(
          (m) =>
            (m.senderId === user?.id && m.receiverId === selectedContact.id) ||
            (m.senderId === selectedContact.id && m.receiverId === user?.id),
        )
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    : [];

  // Count unread per contact
  const unreadCount = (contactId: string) =>
    allMessages.filter(
      (m) => m.senderId === contactId && m.receiverId === user?.id && !m.read,
    ).length;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedContact || sending) return;
    setSending(true);
    try {
      const sent = await messagesApi.send(selectedContact.id, newMessage.trim());
      setAllMessages((prev) => [
        ...prev,
        {
          ...sent,
          sender: { id: user?.id, name: user?.name, avatarUrl: user?.avatarUrl },
          receiver: { id: selectedContact.id, name: selectedContact.name, avatarUrl: selectedContact.avatarUrl },
        },
      ]);
      setNewMessage('');
    } catch {
      /* ignore */
    } finally {
      setSending(false);
    }
  };

  const handleSelectContact = async (contact: Contact) => {
    setSelectedContact(contact);
    const hasUnread = allMessages.some(
      (m) => m.senderId === contact.id && m.receiverId === user?.id && !m.read,
    );
    if (hasUnread) {
      messagesApi.markAllRead(contact.id).catch(() => {});
      setAllMessages((prev) =>
        prev.map((m) =>
          m.senderId === contact.id && m.receiverId === user?.id ? { ...m, read: true } : m,
        ),
      );
    }
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center min-h-64">
          <p className="text-muted-foreground">Chargement…</p>
        </div>
      </StudentLayout>
    );
  }

  if (contacts.length === 0) {
    return (
      <StudentLayout>
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="mb-2">Messages</h1>
            <p className="text-muted-foreground">Communiquez avec vos formateurs</p>
          </div>
          <div className="bg-white border border-indigo-100 border-l-4 border-l-indigo-400 rounded-xl p-12 text-center shadow-sm">
            <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Aucun formateur disponible</h2>
            <p className="text-muted-foreground">
              Vous pourrez envoyer des messages à votre formateur une fois inscrit à un cours.
            </p>
          </div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="mb-2">Messages</h1>
          <p className="text-muted-foreground">Communiquez avec vos formateurs</p>
        </div>

        <div className="rounded-2xl overflow-hidden flex h-[calc(100vh-260px)] min-h-[500px] shadow-lg border border-indigo-100">

          {/* ── Sidebar ── */}
          <div className="w-full md:w-80 bg-gray-50 border-r border-gray-100 flex flex-col flex-shrink-0">

            {/* Gradient header */}
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-500 px-4 py-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-white font-semibold text-sm">Formateurs</span>
                <span className="bg-white/20 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                  {contacts.length}
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
              {filteredContacts.map((contact) => {
                const unread = unreadCount(contact.id);
                const isSelected = selectedContact?.id === contact.id;
                return (
                  <button
                    key={contact.id}
                    onClick={() => handleSelectContact(contact)}
                    className={`w-full px-4 py-3.5 flex items-center gap-3 transition-colors text-left border-b border-gray-100 border-l-4 ${
                      isSelected
                        ? 'bg-indigo-50 border-l-indigo-500'
                        : 'hover:bg-gray-100 border-l-transparent'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0 text-sm ${
                      isSelected ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-700'
                    }`}>
                      {contact.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`font-semibold text-sm truncate ${isSelected ? 'text-indigo-700' : 'text-gray-800'}`}>
                          {contact.name}
                        </span>
                        {unread > 0 && (
                          <span className="ml-1 min-w-[18px] h-[18px] rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold px-1 flex-shrink-0">
                            {unread}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-400">
                        <BookOpen className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{contact.courseTitle}</span>
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
              {selectedContact ? (
                <>
                  <div className="relative">
                    <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                      {selectedContact.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-800">{selectedContact.name}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      {selectedContact.courseTitle}
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-gray-400 text-sm">Sélectionnez un formateur</p>
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
                    {selectedContact ? 'Démarrez la conversation' : 'Sélectionnez un formateur'}
                  </p>
                  {selectedContact && (
                    <p className="text-xs text-gray-400 mt-1">avec {selectedContact.name}</p>
                  )}
                </div>
              ) : (
                currentMessages.map((msg: any) => {
                  const isMine = msg.senderId === user?.id;
                  return (
                    <div key={msg.id} className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
                      {!isMine && (
                        <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {selectedContact?.name.slice(0, 2).toUpperCase()}
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
                          {msg.content}
                        </div>
                        <div className={`text-[10px] text-gray-400 flex items-center gap-1 px-1 ${isMine ? 'justify-end' : ''}`}>
                          <Clock className="w-2.5 h-2.5" />
                          {new Date(msg.createdAt).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
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
                onSubmit={handleSend}
                className="flex items-center gap-3 bg-gray-50 rounded-full px-4 py-2 border border-gray-200 focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-200 transition"
              >
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={
                    selectedContact
                      ? `Message à ${selectedContact.name}…`
                      : 'Sélectionnez un formateur'
                  }
                  disabled={!selectedContact || sending}
                  className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || !selectedContact || sending}
                  className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition disabled:opacity-40 flex-shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}

