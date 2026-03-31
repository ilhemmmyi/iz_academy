import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { TeacherLayout } from '../../components/TeacherLayout';
import { MessageSquare, Reply, Trash2, Send, BookOpen } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { lessonCommentsApi, LessonComment } from '../../../api/lessonComments.api';
import { coursesApi } from '../../../api/courses.api';
import { useAuth } from '../../../context/AuthContext';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h}h`;
  return new Date(dateStr).toLocaleDateString('fr-FR');
}

export function TeacherComments() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [comments, setComments] = useState<LessonComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    coursesApi.getAll().then(data => {
      setCourses(data);
      const paramId = searchParams.get('courseId');
      const initial = paramId && data.find((c: any) => c.id === paramId) ? paramId : (data.length > 0 ? data[0].id : '');
      setSelectedCourseId(initial);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedCourseId) return;
    setLoading(true);
    lessonCommentsApi.getByCourse(selectedCourseId)
      .then(setComments)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedCourseId]);

  const handleReply = async (commentId: string) => {
    if (!replyText.trim() || submitting) return;
    setSubmitting(true);
    try {
      const reply = await lessonCommentsApi.reply(commentId, replyText.trim());
      setComments(prev => prev.map(c =>
        c.id === commentId ? { ...c, replies: [...c.replies, reply] } : c
      ));
      setReplyText('');
      setReplyingTo(null);
    } catch {}
    finally { setSubmitting(false); }
  };

  const handleDelete = async (commentId: string, parentId?: string) => {
    try {
      await lessonCommentsApi.delete(commentId);
      if (parentId) {
        setComments(prev => prev.map(c =>
          c.id === parentId ? { ...c, replies: c.replies.filter(r => r.id !== commentId) } : c
        ));
      } else {
        setComments(prev => prev.filter(c => c.id !== commentId));
      }
    } catch {}
  };

  const totalCount = comments.reduce((acc, c) => acc + 1 + c.replies.length, 0);
  const unanswered = comments.filter(c => c.replies.length === 0).length;

  return (
    <TeacherLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="mb-1">Commentaires des leçons</h1>
          <p className="text-muted-foreground text-sm">Répondez aux questions de vos étudiants</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-l-4 border-l-indigo-400 border-indigo-100 shadow-sm">
            <CardContent className="pt-5">
              <div className="text-2xl font-bold text-indigo-600">{loading ? '…' : totalCount}</div>
              <div className="text-sm text-muted-foreground mt-1">Commentaires au total</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-amber-400 border-amber-100 shadow-sm">
            <CardContent className="pt-5">
              <div className={`text-2xl font-bold ${unanswered > 0 ? 'text-amber-600' : 'text-teal-600'}`}>
                {loading ? '…' : unanswered}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Sans réponse</div>
            </CardContent>
          </Card>
        </div>

        {/* Course picker */}
        {courses.length > 1 && (
          <div className="flex gap-2 flex-wrap">
            {courses.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedCourseId(c.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition border ${selectedCourseId === c.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-white border-border hover:bg-muted'}`}
              >
                {c.title}
              </button>
            ))}
          </div>
        )}

        {/* Comments */}
        {loading ? (
          <p className="text-muted-foreground">Chargement…</p>
        ) : comments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="font-semibold mb-1">Aucun commentaire</p>
              <p className="text-sm text-muted-foreground">Les questions de vos étudiants apparaîtront ici.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {comments.map(comment => (
              <Card key={comment.id}>
                <CardContent className="pt-4 space-y-3">
                  {/* Lesson badge */}
                  {comment.lesson && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <BookOpen className="w-3 h-3" />
                      {comment.lesson.title}
                    </div>
                  )}

                  {/* Comment */}
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {comment.author.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{comment.author.name}</span>
                        <span className="text-xs text-muted-foreground">{timeAgo(comment.createdAt)}</span>
                      </div>
                      <p className="text-sm mt-1 whitespace-pre-wrap">{comment.content}</p>
                      <div className="mt-2 flex gap-3">
                        <button
                          onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                          className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                        >
                          <Reply className="w-3 h-3" /> Répondre
                        </button>
                        <button
                          onClick={() => handleDelete(comment.id)}
                          className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Supprimer
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Existing replies */}
                  {comment.replies.length > 0 && (
                    <div className="ml-11 space-y-3 border-l-2 border-primary/20 pl-4">
                      {comment.replies.map(reply => (
                        <div key={reply.id} className="flex gap-3">
                          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground flex-shrink-0">
                            {reply.author.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm">{reply.author.name}</span>
                              <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">Formateur</span>
                              <span className="text-xs text-muted-foreground">{timeAgo(reply.createdAt)}</span>
                            </div>
                            <p className="text-sm mt-1 whitespace-pre-wrap">{reply.content}</p>
                            <button
                              onClick={() => handleDelete(reply.id, comment.id)}
                              className="mt-1 text-xs text-muted-foreground hover:text-destructive flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" /> Supprimer
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply form */}
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
                        disabled={!replyText.trim() || submitting}
                        className="p-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-40 transition"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </TeacherLayout>
  );
}
