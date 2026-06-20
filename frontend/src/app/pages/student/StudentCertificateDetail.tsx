import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { StudentLayout } from '../../components/StudentLayout';
import {
  ArrowLeft,
  Award,
  BookOpen,
  Calendar,
  Download,
  ExternalLink,
  RefreshCw,
  User,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { certificatesApi } from '../../../api/certificates.api';
import type { CertificateDetail } from '../../../api/certificates.api';

function openBlobInTab(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (win) {
    win.addEventListener('load', () => setTimeout(() => URL.revokeObjectURL(url), 30000), { once: true });
  } else {
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export function StudentCertificateDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [cert, setCert] = useState<CertificateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [pdfLoading, setPdfLoading] = useState<'view' | 'download' | null>(null);

  useEffect(() => {
    if (!id) return;
    certificatesApi
      .getById(id)
      .then(setCert)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  const handleRetry = async () => {
    if (!cert) return;
    setRetrying(true);
    try {
      await certificatesApi.retry(cert.courseId);
      setTimeout(async () => {
        const updated = await certificatesApi.getById(cert.id).catch(() => cert);
        setCert(updated);
        setRetrying(false);
      }, 5000);
    } catch {
      setRetrying(false);
    }
  };

  const handleViewPdf = async () => {
    if (!cert) return;
    setPdfLoading('view');
    try {
      const blob = await certificatesApi.downloadPdf(cert.id);
      openBlobInTab(blob);
    } catch { /* ignore */ }
    finally { setPdfLoading(null); }
  };

  const handleDownloadPdf = async () => {
    if (!cert) return;
    setPdfLoading('download');
    try {
      const blob = await certificatesApi.downloadPdf(cert.id);
      downloadBlob(blob, `certificat-${cert.id.slice(-14).toUpperCase()}.pdf`);
    } catch { /* ignore */ }
    finally { setPdfLoading(null); }
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

  if (notFound || !cert) {
    return (
      <StudentLayout>
        <div className="flex flex-col items-center justify-center min-h-64 space-y-4">
          <Award className="w-16 h-16 text-muted-foreground" />
          <p className="text-xl font-semibold">Certificat introuvable</p>
          <Button variant="outline" onClick={() => navigate('/student/certificates')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Mes certificats
          </Button>
        </div>
      </StudentLayout>
    );
  }

  const dateStr = new Date(cert.issuedAt).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <StudentLayout>
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Toolbar */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <Button variant="outline" onClick={() => navigate('/student/certificates')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Mes certificats
          </Button>
          <div className="flex gap-2 flex-wrap">
            {cert.fileUrl ? (
              <>
                <Button variant="outline" onClick={handleViewPdf} disabled={pdfLoading !== null}>
                  {pdfLoading === 'view'
                    ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    : <ExternalLink className="w-4 h-4 mr-2" />}
                  Voir le PDF
                </Button>
                <Button onClick={handleDownloadPdf} disabled={pdfLoading !== null}>
                  {pdfLoading === 'download'
                    ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    : <Download className="w-4 h-4 mr-2" />}
                  Télécharger le PDF
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={handleRetry} disabled={retrying}>
                <RefreshCw className={`w-4 h-4 mr-2 ${retrying ? 'animate-spin' : ''}`} />
                {retrying ? 'Génération…' : 'Regénérer le PDF'}
              </Button>
            )}
          </div>
        </div>

        {/* ── Detail cards ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-border rounded-xl p-4 flex items-start gap-3">
            <User className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Étudiant</p>
              <p className="font-semibold text-sm truncate">{cert.user.name}</p>
            </div>
          </div>
          <div className="bg-white border border-border rounded-xl p-4 flex items-start gap-3">
            <BookOpen className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Formation</p>
              <p className="font-semibold text-sm truncate">{cert.course.title}</p>
            </div>
          </div>
          <div className="bg-white border border-border rounded-xl p-4 flex items-start gap-3">
            <Award className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Formateur</p>
              <p className="font-semibold text-sm truncate">{cert.course.teacher.name}</p>
            </div>
          </div>
          <div className="bg-white border border-border rounded-xl p-4 flex items-start gap-3">
            <Calendar className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Délivré le</p>
              <p className="font-semibold text-sm">{dateStr}</p>
            </div>
          </div>
        </div>

        {/* Warning if PDF not yet ready */}
        {!cert.fileUrl && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800 text-sm">
            Le fichier PDF est en cours de génération. Cliquez sur "Regénérer le PDF" si le
            bouton de téléchargement n'apparaît pas après quelques secondes.
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
