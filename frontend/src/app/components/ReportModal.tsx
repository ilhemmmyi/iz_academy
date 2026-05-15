import { useState } from 'react';
import { Flag, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { reportsApi } from '../../api/reports.api';
import { toast } from 'sonner';

interface ReportModalProps {
  open: boolean;
  onClose: () => void;
  messageId?: string;
  commentId?: string;
  /** Short label shown in the dialog description, e.g. "ce commentaire" */
  targetLabel?: string;
}

export function ReportModal({
  open,
  onClose,
  messageId,
  commentId,
  targetLabel = 'ce contenu',
}: ReportModalProps) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    if (submitting) return;
    setReason('');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || submitting) return;
    setSubmitting(true);
    try {
      await reportsApi.create({ reason: reason.trim(), messageId, commentId });
      toast.success('Signalement envoyé', {
        description: 'L\'administrateur examinera votre signalement.',
      });
      setReason('');
      onClose();
    } catch (err: any) {
      if (err?.message?.includes('already')) {
        toast.error('Déjà signalé', { description: 'Vous avez déjà signalé ce contenu.' });
        onClose();
      } else {
        toast.error('Erreur', { description: 'Impossible d\'envoyer le signalement.' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="w-4 h-4 text-red-500" />
            Signaler {targetLabel}
          </DialogTitle>
          <DialogDescription>
            Décrivez brièvement la raison de ce signalement. L&apos;administrateur en sera notifié.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className="block text-sm font-medium mb-1">Raison *</label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Ex : contenu inapproprié, harcèlement, spam…"
              className="w-full px-3 py-2 border border-border rounded-lg bg-input-background resize-none focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="px-4 py-2 border border-border rounded-lg hover:bg-accent transition text-sm"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!reason.trim() || submitting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-2 text-sm"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Envoyer le signalement
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
