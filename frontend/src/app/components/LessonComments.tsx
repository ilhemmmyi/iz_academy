import { useState, useEffect } from 'react';
import { MessageSquare, Send, Trash2, Reply, ChevronDown, ChevronUp, Flag } from 'lucide-react';
import { lessonCommentsApi, LessonComment, LessonCommentReply } from '../../api/lessonComments.api';
import { useAuth } from '../../context/AuthContext';
import { ReportModal } from './ReportModal';

interface Props {
  lessonId: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h}h`;
  return new Date(dateStr).toLocaleDateString('fr-FR');
}

function Avatar({ name, role }: { name: string; role: string }) {
  const isTeacher = role === 'TEACHER' || role === 'ADMIN';
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isTeacher ? 'bg-primary text-primary-foreground' : 'bg-slate-200 text-slate-700'}`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export function LessonComments({ lessonId }: Props) {
  const { user } = useAuth();
  const [comments, setComments] = useState<LessonComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyingSubmitting, setReplyingSubmitting] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [reportTarget, setReportTarget] = useState<{ type: 'comment' | 'message'; id: string } | null>(null);

  useEffect(() => {
    setLoading(true);
    setComments([]);
    lessonCommentsApi.getByLesson(lessonId)
      .then(setComments)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [lessonId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;
    setSubmitting(true);
    try {
      const comment = await lessonCommentsApi.create(lessonId, newComment.trim());
      setComments(prev => [...prev, comment]);
      setNewComment('');
    } catch {}
    finally { setSubmitting(false); }
  };

  const handleReply = async (commentId: string) => {
    if (!replyText.trim() || replyingSubmitting) return;
    setReplyingSubmitting(true);
    try {
      const reply = await lessonCommentsApi.reply(commentId, replyText.trim());
      setComments(prev => prev.map(c =>
        c.id === commentId ? { ...c, replies: [...c.replies, reply] } : c
      ));
      setReplyText('');
      setReplyingTo(null);
    } catch {}
    finally { setReplyingSubmitting(false); }
  };

  const handleDelete = async (commentId: string, parentId?: string) => {
    try {
      await lessonCommentsApi.delete(commentId);
      if (parentId) {
        setComments(prev => prev.map(c =>
          c.id === parentId ? { ...c, replies: c.replies.filter((r: LessonCommentReply) => r.id !== commentId) } : c
        ));
      } else {
        setComments(prev => prev.filter(c => c.id !== commentId));
      }
    } catch {}
  };

  const canDelete = (authorId: string) =>
    user?.id === authorId || user?.role === 'ADMIN' || user?.role === 'TEACHER';

  const totalCount = comments.reduce((acc, c) => acc + 1 + c.replies.length, 0);

  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <button
        className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-2 font-semibold">
          <MessageSquare className="w-5 h-5 text-primary" />
          Commentaires &amp; Questions
          {totalCount > 0 && (
            <span className="ml-1 bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5">
              {totalCount}
            </span>
          )}
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="border-t border-border">
          {/* New comment form */}
          <form onSubmit={handleSubmit} className="p-4 border-b border-border flex gap-3">
            <Avatar name={user?.name ?? '?'} role={user?.role ?? ''} />
            <div className="flex-1 flex gap-2 items-end">
              <textarea
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Posez une question sur cette leçon…"
                rows={2}
                className="flex-1 resize-none rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e as any); } }}
              />
              <button
                type="submit"
                disabled={!newComment.trim() || submitting}
                className="p-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-40 transition flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Comments list */}
          <div className="divide-y divide-border">
            {loading ? (
              <p className="p-4 text-sm text-muted-foreground">Chargement…</p>
            ) : comments.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">Aucun commentaire. Soyez le premier !</p>
            ) : (
              comments.map(comment => (
                <div key={comment.id} className="p-4 space-y-3">
                  {/* Top-level comment */}
                  <div className="flex gap-3">
                    <Avatar name={comment.author.name} role={comment.author.role} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{comment.author.name}</span>
                        {(comment.author.role === 'TEACHER' || comment.author.role === 'ADMIN') && (
                          <span className="text-xs bg-primary/10 text-primary font-medium px-1.5 py-0.5 rounded">Formateur</span>
                        )}
                        <span className="text-xs text-muted-foreground">{timeAgo(comment.createdAt)}</span>
                      </div>
                      <p className="text-sm mt-1 whitespace-pre-wrap">{comment.content}</p>
                      <div className="mt-2 flex items-center gap-3">
                        <button
                          onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                          className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition"
                        >
                          <Reply className="w-3 h-3" /> Répondre
                        </button>
                        {canDelete(comment.authorId) && (
                          <button
                            onClick={() => handleDelete(comment.id)}
                            className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition"
                          >
                            <Trash2 className="w-3 h-3" /> Supprimer
                          </button>
                        )}
                        {user?.id !== comment.authorId && (
                          <button
                            onClick={() => setReportTarget({ type: 'comment', id: comment.id })}
                            className="text-xs text-muted-foreground hover:text-red-500 flex items-center gap-1 transition"
                            title="Signaler ce commentaire"
                          >
                            <Flag className="w-3 h-3" /> Signaler
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Replies */}
                  {comment.replies.length > 0 && (
                    <div className="ml-11 space-y-3 border-l-2 border-primary/20 pl-4">
                      {comment.replies.map((reply: LessonCommentReply) => (
                        <div key={reply.id} className="flex gap-3">
                          <Avatar name={reply.author.name} role={reply.author.role} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-sm">{reply.author.name}</span>
                              {(reply.author.role === 'TEACHER' || reply.author.role === 'ADMIN') && (
                                <span className="text-xs bg-primary/10 text-primary font-medium px-1.5 py-0.5 rounded">Formateur</span>
                              )}
                              <span className="text-xs text-muted-foreground">{timeAgo(reply.createdAt)}</span>
                            </div>
                            <p className="text-sm mt-1 whitespace-pre-wrap">{reply.content}</p>
                            <div className="mt-1 flex items-center gap-3">
                              {canDelete(reply.authorId) && (
                                <button
                                  onClick={() => handleDelete(reply.id, comment.id)}
                                  className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition"
                                >
                                  <Trash2 className="w-3 h-3" /> Supprimer
                                </button>
                              )}
                              {user?.id !== reply.authorId && (
                                <button
                                  onClick={() => setReportTarget({ type: 'comment', id: reply.id })}
                                  className="text-xs text-muted-foreground hover:text-red-500 flex items-center gap-1 transition"
                                  title="Signaler cette réponse"
                                >
                                  <Flag className="w-3 h-3" /> Signaler
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply input */}
                  {replyingTo === comment.id && (
                    <div className="ml-11 flex gap-2 items-end">
                      <textarea
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        placeholder="Votre réponse…"
                        rows={2}
                        autoFocus
                        className="flex-1 resize-none rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(comment.id); } }}
                      />
                      <button
                        onClick={() => handleReply(comment.id)}
                        disabled={!replyText.trim() || replyingSubmitting}
                        className="p-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-40 transition flex-shrink-0"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <ReportModal
        open={reportTarget !== null}
        onClose={() => setReportTarget(null)}
        commentId={reportTarget?.type === 'comment' ? reportTarget.id : undefined}
        targetLabel="ce commentaire"
      />
    </div>
  );
}
