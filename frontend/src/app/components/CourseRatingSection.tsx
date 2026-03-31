import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { coursesApi } from '../../api/courses.api';
import { useAuth } from '../../context/AuthContext';

interface Props {
  courseId: string;
  canRate: boolean;
}

function StarButton({ filled, half, onClick, onHover }: {
  filled: boolean; half: boolean; onClick: () => void; onHover: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onHover}
      className="focus:outline-none"
    >
      <Star
        className={`w-7 h-7 transition-colors ${filled || half ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`}
      />
    </button>
  );
}

export function CourseRatingSection({ courseId, canRate }: Props) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [average, setAverage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // form state
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const fetchReviews = () => {
    setLoading(true);
    coursesApi.getReviews(courseId)
      .then((data: any) => {
        setReviews(data.reviews || []);
        setAverage(data.average || 0);
        setTotal(data.total || 0);
        // Pre-fill if current user already reviewed
        if (user) {
          const mine = (data.reviews || []).find((r: any) => r.user?.id === user.id);
          if (mine) {
            setSelected(mine.rating);
            setComment(mine.comment || '');
            setSubmitted(true);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchReviews(); }, [courseId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || submitting) return;
    setSubmitting(true);
    try {
      await coursesApi.submitReview(courseId, selected, comment.trim() || undefined);
      setSubmitted(true);
      fetchReviews();
    } catch {}
    finally { setSubmitting(false); }
  };

  return (
    <div className="bg-white border border-amber-100 border-l-4 border-l-amber-400 rounded-xl overflow-hidden shadow-sm">
      <div className="p-4 border-b border-amber-100 bg-amber-50/40">
        <h3>Avis des étudiants</h3>
      </div>

      <div className="p-4 space-y-4">
        {/* Average */}
        {total > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-amber-500">{average.toFixed(1)}</span>
            <div>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${s <= Math.round(average) ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">{total} avis</p>
            </div>
          </div>
        )}

        {/* Rating form */}
        {canRate ? (
          <form onSubmit={handleSubmit} className="space-y-3 border-t border-amber-100 pt-3">
            <p className="text-sm font-medium">
              {submitted ? 'Modifier votre note' : 'Notez ce cours'}
            </p>
            <div
              className="flex gap-1"
              onMouseLeave={() => setHovered(0)}
            >
              {[1, 2, 3, 4, 5].map(s => (
                <StarButton
                  key={s}
                  filled={s <= (hovered || selected)}
                  half={false}
                  onClick={() => setSelected(s)}
                  onHover={() => setHovered(s)}
                />
              ))}
            </div>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Laissez un commentaire (optionnel)"
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
            <button
              type="submit"
              disabled={!selected || submitting}
              className="w-full py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Envoi...' : submitted ? 'Mettre à jour' : 'Soumettre'}
            </button>
          </form>
        ) : (
          <p className="text-xs text-muted-foreground border-t border-amber-100 pt-3">
            Terminez le cours pour laisser un avis.
          </p>
        )}

        {/* Reviews list */}
        {!loading && reviews.length > 0 && (
          <div className="space-y-3 border-t border-amber-100 pt-3 max-h-48 overflow-y-auto">
            {reviews.map((r: any) => (
              <div key={r.id} className="text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-700">{r.user?.name || 'Étudiant'}</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={`w-3 h-3 ${s <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
                    ))}
                  </div>
                </div>
                {r.comment && <p className="text-muted-foreground mt-0.5">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}

        {!loading && total === 0 && !canRate && (
          <p className="text-xs text-muted-foreground">Aucun avis pour l'instant.</p>
        )}
      </div>
    </div>
  );
}
