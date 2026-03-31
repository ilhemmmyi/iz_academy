import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  BookOpen,
  Mail,
  Calendar
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
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
}

export function AdminEnrollmentRequests() {
  const [requests, setRequests] = useState<EnrollmentRequest[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleReject = async (requestId: string) => {
    try {
      await enrollmentsApi.updateStatus(requestId, 'REJECTED');
      setRequests(requests.map(r =>
        r.id === requestId ? { ...r, status: 'rejected' as const } : r
      ));
      toast.success('Demande rejetée');
    } catch {
      toast.error('Erreur lors du rejet');
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const approvedRequests = requests.filter(r => r.status === 'approved');
  const rejectedRequests = requests.filter(r => r.status === 'rejected');

  const RequestCard = ({ request }: { request: EnrollmentRequest }) => (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3>{request.studentName}</h3>
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
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Mail className="w-4 h-4" />
                {request.studentEmail}
              </div>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{request.courseName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Demandé le {request.requestDate}</span>
            </div>
          </div>

          {request.message && (
            <div className="p-3 bg-accent rounded-lg">
              <p className="text-sm italic">"{request.message}"</p>
            </div>
          )}

          {request.status === 'pending' && (
            <div className="flex gap-2">
              <Button 
                className="flex-1"
                onClick={() => handleApprove(request.id)}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approuver
              </Button>
              <Button 
                variant="destructive"
                className="flex-1"
                onClick={() => handleReject(request.id)}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Rejeter
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="mb-2">Demandes d'inscription</h1>
          <p className="text-muted-foreground">
            Gérez les demandes d'accès aux formations
          </p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-l-4 border-l-amber-400 border-amber-100 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-amber-600 mb-1">
                    {pendingRequests.length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    En attente
                  </div>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg">
                  <Clock className="w-8 h-8 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-teal-400 border-teal-100 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-teal-600 mb-1">
                    {approvedRequests.length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Approuvées
                  </div>
                </div>
                <div className="p-3 bg-teal-50 rounded-lg">
                  <CheckCircle className="w-8 h-8 text-teal-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-400 border-red-100 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-red-600 mb-1">
                    {rejectedRequests.length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Rejetées
                  </div>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <XCircle className="w-8 h-8 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Liste des demandes */}
        <Tabs defaultValue="pending" className="w-full">
          <TabsList>
            <TabsTrigger value="pending">
              En attente ({pendingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approuvées ({approvedRequests.length})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejetées ({rejectedRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4 mt-6">
            {pendingRequests.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-6">
                {pendingRequests.map(request => (
                  <RequestCard key={request.id} request={request} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl mb-2">Aucune demande en attente</h3>
                  <p className="text-muted-foreground">
                    Toutes les demandes ont été traitées
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-4 mt-6">
            <div className="grid md:grid-cols-2 gap-6">
              {approvedRequests.map(request => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4 mt-6">
            <div className="grid md:grid-cols-2 gap-6">
              {rejectedRequests.map(request => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
