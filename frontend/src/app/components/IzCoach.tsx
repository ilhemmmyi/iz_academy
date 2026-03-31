import { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Upload, Loader2, Sparkles, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { coachApi, ChatMessage, CVAnalysisResult } from '../../api/coach.api';

export function IzCoach() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [cvAnalysis, setCvAnalysis] = useState<CVAnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'cv' | 'roadmap'>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Chat ────────────────────────────────────────────────────────────────
  const sendMessage = async () => {
    if (!input.trim() || loading || !user) return;
    const userMsg: ChatMessage = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const context: Record<string, unknown> = {};
      if (cvAnalysis) {
        context.profile_summary = cvAnalysis.profile_summary;
        context.extracted_skills = cvAnalysis.extracted_skills;
        context.skill_gaps = cvAnalysis.skill_gaps;
      }
      const result = await coachApi.chat(user.id, userMsg.content, messages, context);
      setMessages(prev => [...prev, { role: 'assistant', content: result.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "Désolé, je n'ai pas pu répondre. Réessaie dans un instant." }]);
    } finally {
      setLoading(false);
    }
  };

  // ── CV Upload ───────────────────────────────────────────────────────────
  const handleCVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setLoading(true);
    try {
      const result = await coachApi.analyzeCVFile(user.id, file);
      setCvAnalysis(result);
      setActiveTab('cv');
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: `✅ J'ai analysé ton CV ! Voici un résumé :\n\n${result.profile_summary}\n\nJ'ai trouvé ${result.extracted_skills.length} compétences et ${result.skill_gaps.length} lacunes à combler. Consulte l'onglet "CV" pour les détails.` },
      ]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "Erreur lors de l'analyse du CV. Vérifie le format (PDF, DOCX ou TXT) et réessaie." }]);
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSuggestionClick = (text: string) => {
    setInput(text);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110"
        title="IZ Coach"
      >
        <Bot className="w-7 h-7" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[400px] h-[600px] bg-white rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          <div>
            <h3 className="font-semibold text-sm">IZ Coach</h3>
            <p className="text-xs text-blue-200">Ton coach carrière IA</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-white/20 rounded-lg transition">
            <ChevronDown className="w-4 h-4" />
          </button>
          <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-white/20 rounded-lg transition">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border shrink-0">
        {(['chat', 'cv', 'roadmap'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-xs font-medium transition ${activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {tab === 'chat' ? '💬 Chat' : tab === 'cv' ? '📄 CV' : '🗺️ Roadmap'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'chat' && (
          <div className="space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <Bot className="w-12 h-12 mx-auto text-blue-400 mb-3" />
                <p className="text-sm font-medium mb-1">Bienvenue sur IZ Coach !</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Je suis ton coach carrière IA. Pose-moi une question ou upload ton CV pour commencer.
                </p>
                <div className="space-y-2">
                  {[
                    "Quelles compétences dois-je développer ?",
                    "Aide-moi à préparer un entretien",
                    "Suggère-moi des projets portfolio",
                  ].map((s, i) => (
                    <button key={i} onClick={() => handleSuggestionClick(s)} className="block w-full text-left text-xs px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm whitespace-pre-wrap ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-foreground'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-3 py-2 rounded-xl">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {activeTab === 'cv' && (
          <div className="space-y-4">
            {!cvAnalysis ? (
              <div className="text-center py-8">
                <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm mb-2">Upload ton CV pour une analyse complète</p>
                <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Choisir un fichier'}
                </button>
              </div>
            ) : (
              <>
                <div className="bg-blue-50 rounded-lg p-3">
                  <h4 className="text-xs font-semibold text-blue-700 mb-1">Résumé du profil</h4>
                  <p className="text-xs text-blue-900">{cvAnalysis.profile_summary}</p>
                </div>
                <div>
                  <h4 className="text-xs font-semibold mb-2">Compétences détectées ({cvAnalysis.extracted_skills.length})</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {cvAnalysis.extracted_skills.map((s, i) => (
                      <span key={i} className={`text-xs px-2 py-1 rounded-full ${s.level === 'advanced' ? 'bg-green-100 text-green-700' : s.level === 'intermediate' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                        {s.name}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-semibold mb-2">Lacunes à combler ({cvAnalysis.skill_gaps.length})</h4>
                  <div className="space-y-1.5">
                    {cvAnalysis.skill_gaps.map((g, i) => (
                      <div key={i} className={`text-xs p-2 rounded-lg ${g.priority === 'high' ? 'bg-red-50 border border-red-200' : g.priority === 'medium' ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50 border border-gray-200'}`}>
                        <span className="font-medium">{g.skill}</span> — {g.reason}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-semibold mb-2">Rôles recommandés</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {cvAnalysis.recommended_roles.map((r, i) => (
                      <span key={i} className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">{r}</span>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'roadmap' && (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              {cvAnalysis
                ? "Demande-moi de générer ta roadmap dans le chat !"
                : "Upload d'abord ton CV pour que je puisse créer ta roadmap personnalisée."}
            </p>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-border p-3 shrink-0">
        <div className="flex items-center gap-2">
          <input ref={fileInputRef} type="file" accept=".txt,.pdf,.doc,.docx" onChange={handleCVUpload} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="p-2 text-muted-foreground hover:text-blue-600 transition" title="Upload CV">
            <Upload className="w-4 h-4" />
          </button>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Pose ta question..."
            className="flex-1 text-sm px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button onClick={sendMessage} disabled={!input.trim() || loading} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
