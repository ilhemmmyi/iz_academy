import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  BookOpen,
  Mail,
  Calendar,
  Phone,
  MapPin,
  GraduationCap,
  Briefcase,
  Search,
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { toast } from 'sonner';
import { enrollmentsApi } from '../../../api/enrollments.api';

interface EnrollmentRequest {
  id: string;
  studentName: string;
  studentEmail: string;
  courseName: string;
  courseId: string;
  requestDate: string;
  status: 'pending' | 'approved' | 'rejected';
  message?: string;
  phone?: string;
  address?: string;
  educationLevel?: string;
  studentStatus?: string;
}

export function AdminEnrollmentRequests() {
  const [requests, setRequests] = useState<EnrollmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    enrollmentsApi.getAll()
      .then((data: any[]) => {
        setRequests(data.map(e => ({
          id: e.id,
          studentName: e.user?.name || 'Inconnu',
          studentEmail: e.user?.email || '',
          courseName: e.course?.title || 'Cours inconnu',
          courseId: e.courseId,
          requestDate: new Date(e.createdAt).toLocaleDateString('fr-FR'),
          status: e.status === 'APPROVED' ? 'approved' : e.status === 'REJECTED' ? 'rejected' : 'pending',
          message: e.message,
          phone: e.phone || undefined,
          address: e.address || undefined,
          educationLevel: e.educationLevel || undefined,
          studentStatus: e.studentStatus || undefined,
        })));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleApprove = async (requestId: string) => {
    try {
      await enrollmentsApi.updateStatus(requestId, 'APPROVED');
      setRequests(requests.map(r =>
        r.id === requestId ? { ...r, status: 'approved' as const } : r
      ));
      toast.success('Demande approuvée avec succès');
    } catch {
      toast.error('Erreur lors de l\'approbation');
    }
  };

  const handleDelete = async (requestId: string) => {
    try {
      await enrollmentsApi.delete(requestId);
      setRequests(requests.filter(r => r.id !== requestId));
      toast.success('Demande supprimée');
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const matchesSearch = (r: EnrollmentRequest) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      r.studentName.toLowerCase().includes(q) ||
      r.studentEmail.toLowerCase().includes(q) ||
      (r.phone || '').toLowerCase().includes(q) ||
      (r.address || '').toLowerCase().includes(q)
    );
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const approvedRequests = requests.filter(r => r.status === 'approved');
  const filteredPending = pendingRequests.filter(matchesSearch);
  const filteredApproved = approvedRequests.filter(matchesSearch);

  const RequestCard = ({ request }: { request: EnrollmentRequest }) => (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-base font-semibold">{request.studentName}</h3>
                <Badge
                  variant={
                    request.status === 'approved'
                      ? 'default'
                      : request.status === 'rejected'
                      ? 'destructive'
                      : 'secondary'
                  }
                >
                  {request.status === 'approved' && <CheckCircle className="w-3 h-3 mr-1" />}
                  {request.status === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
                  {request.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                  {request.status === 'approved' ? 'Approuvée' :
                   request.status === 'rejected' ? 'Rejetée' :
                   'En attente'}
                </Badge>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Mail className="w-3.5 h-3.5" />
                {request.studentEmail}
              </div>
            </div>
          </div>

          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="font-medium">{request.courseName}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Demandé le {request.requestDate}</span>
            </div>
          </div>

          {request.message && (
            <div className="px-3 py-2 bg-accent rounded-lg">
              <p className="text-xs italic">"{request.message}"</p>
            </div>
          )}

          {/* Profil étudiant */}
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="bg-muted/50 px-3 py-1.5 border-b border-border flex items-center gap-1.5">
              <User className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Profil de l'étudiant
              </span>
            </div>
            <div className="px-3 py-2 space-y-1.5">
              <div className="flex items-center gap-2 text-xs">
                <User className="w-3 h-3 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground w-24 shrink-0">Nom</span>
                <span className="font-medium">{request.studentName}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Mail className="w-3 h-3 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground w-24 shrink-0">Email</span>
                <span className="font-medium">{request.studentEmail}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Phone className="w-3 h-3 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground w-24 shrink-0">Téléphone</span>
                <span className={request.phone ? 'font-medium' : 'text-muted-foreground'}>
                  {request.phone || '—'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground w-24 shrink-0">Adresse</span>
                <span className={request.address ? 'font-medium' : 'text-muted-foreground'}>
                  {request.address || '—'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <GraduationCap className="w-3 h-3 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground w-24 shrink-0">Niveau scolaire</span>
                <span className={request.educationLevel ? 'font-medium' : 'text-muted-foreground'}>
                  {request.educationLevel || '—'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Briefcase className="w-3 h-3 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground w-24 shrink-0">Statut</span>
                <span className={request.studentStatus ? 'font-medium' : 'text-muted-foreground'}>
                  {request.studentStatus || '—'}
                </span>
              </div>
            </div>
          </div>

          {request.status === 'pending' && (
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1"
                onClick={() => handleApprove(request.id)}
              >
                <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                Approuver
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="flex-1"
                onClick={() => handleDelete(request.id)}
              >
                <XCircle className="w-3.5 h-3.5 mr-1.5" />
                Supprimer
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="max-w-7xl mx-auto">
          <div className="bg-white border border-border rounded-xl p-12 text-center text-muted-foreground">
            Chargement des demandes...
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* En-tête */}
        <div>
          <h1 className="mb-2">Demandes d'inscription</h1>
          <p className="text-muted-foreground">
            Gérez les demandes d'accès aux formations
          </p>
        </div>

        {/* Barre de recherche */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Rechercher par nom, email, téléphone ou adresse…"
            className="w-full pl-11 pr-4 py-3 border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary text-sm shadow-sm"
          />
        </div>

        {/* Liste des demandes */}
        <Tabs defaultValue="pending" className="w-full">
          <TabsList>
            <TabsTrigger value="pending">
              En attente ({filteredPending.length})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approuvées ({filteredApproved.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4 mt-6">
            {filteredPending.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {filteredPending.map(request => (
                  <RequestCard key={request.id} request={request} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-40" />
                  <h3 className="text-xl mb-2">
                    {searchQuery ? 'Aucun résultat pour cette recherche' : 'Aucune demande en attente'}
                  </h3>
                  <p className="text-muted-foreground">
                    {searchQuery ? 'Essayez un autre mot-clé.' : 'Toutes les demandes ont été traitées.'}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-4 mt-6">
            {filteredApproved.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {filteredApproved.map(request => (
                  <RequestCard key={request.id} request={request} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-40" />
                  <h3 className="text-xl mb-2">
                    {searchQuery ? 'Aucun résultat pour cette recherche' : 'Aucune demande approuvée'}
                  </h3>
                  <p className="text-muted-foreground">
                    {searchQuery ? 'Essayez un autre mot-clé.' : 'Aucune demande n\'a encore été approuvée.'}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
