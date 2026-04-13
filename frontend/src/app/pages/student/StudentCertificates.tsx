import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { StudentLayout } from '../../components/StudentLayout';
import { Award, Download, ExternalLink, RefreshCw, Eye } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { certificatesApi, Certificate } from '../../../api/certificates.api';

/** Trigger a file download from a Blob */
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

export function StudentCertificates() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [viewing, setViewing] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    certificatesApi.getMine()
      .then(setCertificates)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleRetry = async (courseId: string) => {
    setRetrying(courseId);
    try {
      await certificatesApi.retry(courseId);
      setTimeout(async () => {
        const updated = await certificatesApi.getMine().catch(() => certificates);
        setCertificates(updated);
        setRetrying(null);
      }, 5000);
    } catch {
      setRetrying(null);
    }
  };

  const handleDownload = async (certId: string, shortId: string) => {
    setDownloading(certId);
    try {
      const blob = await certificatesApi.downloadPdf(certId);
      downloadBlob(blob, `certificat-${shortId}.pdf`);
    } catch { /* ignore */ }
    finally { setDownloading(null); }
  };

  const handleView = async (certId: string) => {
    setViewing(certId);
    try {
      const blob = await certificatesApi.downloadPdf(certId);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch { /* ignore */ }
    finally { setViewing(null); }
  };

  return (
    <StudentLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="mb-2">Mes certificats</h1>
          <p className="text-muted-foreground">
            Consultez et téléchargez vos certificats de formation
          </p>
        </div>

        {/* Certificats obtenus */}
        <div className="space-y-4">
          <h2>Certificats obtenus</h2>

          {loading ? (
            <p className="text-muted-foreground">Chargement…</p>
          ) : certificates.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Award className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl mb-2">Aucun certificat pour le moment</h3>
                <p className="text-muted-foreground">
                  Faites valider votre projet par votre formateur pour obtenir votre certificat.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {certificates.map((cert) => (
                <Card key={cert.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      {cert.course.thumbnailUrl ? (
                        <img
                          src={cert.course.thumbnailUrl}
                          alt={cert.course.title}
                          className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Award className="w-8 h-8 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{cert.course.title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Formateur : {cert.course.teacher.name}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Obtenu le{' '}
                          {new Date(cert.issuedAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-3">
                          {/* Always show preview link */}
                          <button
                            onClick={() => navigate(`/student/certificates/${cert.id}`)}
                            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                          >
                            <Eye className="w-4 h-4" />
                            Prévisualiser
                          </button>

                          {cert.fileUrl ? (
                            <>
                              <button
                                onClick={() => handleView(cert.id)}
                                disabled={viewing === cert.id}
                                className="inline-flex items-center gap-1 text-sm text-primary hover:underline disabled:opacity-50"
                              >
                                <ExternalLink className="w-4 h-4" />
                                {viewing === cert.id ? 'Chargement…' : 'Voir PDF'}
                              </button>
                              <button
                                onClick={() => handleDownload(cert.id, cert.id.slice(-8).toUpperCase())}
                                disabled={downloading === cert.id}
                                className="inline-flex items-center gap-1 text-sm text-primary hover:underline disabled:opacity-50"
                              >
                                <Download className={`w-4 h-4 ${downloading === cert.id ? 'animate-bounce' : ''}`} />
                                {downloading === cert.id ? 'Téléchargement…' : 'Télécharger'}
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleRetry(cert.courseId)}
                              disabled={retrying === cert.courseId}
                              className="inline-flex items-center gap-1 text-sm text-amber-600 hover:underline disabled:opacity-50"
                            >
                              <RefreshCw
                                className={`w-4 h-4 ${retrying === cert.courseId ? 'animate-spin' : ''}`}
                              />
                              {retrying === cert.courseId ? 'Génération…' : 'Regénérer le certificat'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="p-3 bg-blue-100 rounded-lg h-fit">
                <Award className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="mb-2 text-blue-900">Comment obtenir un certificat ?</h3>
                <ul className="space-y-1 text-sm text-blue-800">
                  <li>• Complétez toutes les leçons du cours</li>
                  <li>• Soumettez votre projet pratique avec le lien GitHub</li>
                  <li>• Attendez la validation du formateur — le certificat est généré automatiquement</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </StudentLayout>
  );
}
