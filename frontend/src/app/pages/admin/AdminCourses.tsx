import { Link, useNavigate } from 'react-router';
import { AdminLayout } from '../../components/AdminLayout';
import { Search, Plus, Edit, Trash2, Eye, Globe, EyeOff, BookOpen } from 'lucide-react';
import { useState, useEffect } from 'react';
import { coursesApi } from '../../../api/courses.api';
import { toast } from 'sonner';

export function AdminCourses() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    coursesApi.getAdmin()
      .then(data => setCourses(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer ce cours ?')) return;
    try {
      await coursesApi.delete(id);
      setCourses(prev => prev.filter(c => c.id !== id));
      toast.success('Cours supprimé');
    } catch { toast.error('Erreur lors de la suppression'); }
  };

  const handleTogglePublish = async (id: string) => {
    try {
      const { isPublished } = await coursesApi.togglePublish(id);
      setCourses(prev => prev.map(c => c.id === id ? { ...c, isPublished } : c));
      toast.success(isPublished ? 'Cours publié' : 'Cours repassé en brouillon');
    } catch { toast.error('Erreur lors de la publication'); }
  };

  const filtered = courses.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1>Gestion des cours</h1>
          <Link to="/admin/create-course">
  <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition flex items-center gap-2">
    <Plus className="w-4 h-4" />
    Créer un cours
  </button>
</Link>
        </div>

        <div className="bg-white border border-border rounded-xl p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un cours..."
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="grid gap-6">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Chargement...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Aucun cours trouvé.</div>
          ) : filtered.map((course) => (
            <div key={course.id} className={`bg-white border rounded-xl p-6 border-l-4 shadow-sm ${
              course.isPublished ? 'border-l-teal-400 border-teal-100' : 'border-l-amber-400 border-amber-100'
            }`}>
              <div className="flex gap-4 mb-4">
                {/* Thumbnail */}
                {course.thumbnailUrl ? (
                  <img src={course.thumbnailUrl} alt="" className="w-28 h-18 object-cover rounded-lg flex-shrink-0" style={{height: '4.5rem'}} />
                ) : (
                  <div className="w-28 rounded-lg bg-muted flex items-center justify-center flex-shrink-0" style={{height: '4.5rem'}}>
                    <BookOpen className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 flex items-start justify-between">
                  <div>
                    <h3 className="mb-1">{course.title}</h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>Formateur: {course.teacher?.name || '—'}</span>
                      <span>•</span>
                      <span>{course.category?.name || '—'}</span>
                      <span>•</span>
                      <span>{course.level}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-accent rounded-lg transition" title="Voir" onClick={() => navigate(`/admin/courses/${course.id}`)}>
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      className="p-2 hover:bg-accent rounded-lg transition"
                      title="Modifier"
                      onClick={() => navigate(`/admin/courses/${course.id}/edit`)}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleTogglePublish(course.id)}
                      className={`p-2 rounded-lg transition ${
                        course.isPublished
                          ? 'hover:bg-yellow-50 text-yellow-600'
                          : 'hover:bg-green-50 text-green-600'
                      }`}
                      title={course.isPublished ? 'Dépublier' : 'Publier'}
                    >
                      {course.isPublished ? <EyeOff className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                    </button>
                    <button
                      className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition"
                      title="Supprimer"
                      onClick={() => handleDelete(course.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                  course.isPublished ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {course.isPublished ? 'Publié' : 'Brouillon'}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">{course.price ? `${course.price}DT` : 'Gratuit'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
