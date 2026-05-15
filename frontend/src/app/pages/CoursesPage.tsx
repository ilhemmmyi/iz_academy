import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Search, Filter } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { coursesApi } from '../../api/courses.api';

export function CoursesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    coursesApi.getAll()
      .then(data => setAllCourses(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Extraire les catégories uniques
  const categories = ['all', ...new Set(allCourses.map((c: any) => c.category?.name).filter(Boolean))];
  // Filtrer les cours
  const filteredCourses = allCourses.filter((course: any) => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (course.shortDescription || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || course.category?.name === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Header */}
<div className="relative bg-gradient-to-br from-purple-100 via-sky-100 to-green-100 py-16 px-4 overflow-hidden">

  <div className="max-w-7xl mx-auto text-center">
    <h1 className="text-4xl md:text-5xl mb-4 text-gray-900">Tous nos cours</h1>
    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
      Découvrez notre catalogue complet de formations et trouvez celle qui vous correspond
    </p>
  </div>

</div>
      {/* Filtres et Recherche */}
      <div className="bg-white border-b border-border sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Barre de recherche */}
            <div className="md:col-span-4 lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Rechercher un cours..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtre Catégorie */}
            <div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {cat === 'all' ? 'Toutes les catégories' : cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

          </div>
        </div>
      </div>

      {/* Résultats */}
      <div className="flex-1 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 text-muted-foreground">
            {loading ? 'Chargement...' : `${filteredCourses.length} cours trouvé${filteredCourses.length > 1 ? 's' : ''}`}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course: any) => (
              <Link
                key={course.id}
                to={`/course/${course.id}`}
                className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition group"
              >
                <div className="aspect-video bg-muted overflow-hidden">
                  <img
                    src={course.thumbnailUrl}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary">{course.category?.name}</Badge>
                    <Badge variant="outline">{course.level}</Badge>
                  </div>
                  <h3 className="mb-2 line-clamp-1">{course.title}</h3>
                  <p className="text-muted-foreground mb-4 line-clamp-2">
                    {course.shortDescription}
                  </p>
                  <div className="text-sm text-muted-foreground mb-3">
                    Par {course.teacher?.name}
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <span className="font-semibold text-lg">{course.price ? `${course.price}DT` : 'Gratuit'}</span>
                    <span className="text-sm text-muted-foreground">{course.duration}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {!loading && filteredCourses.length === 0 && (
            <div className="text-center py-12">
              <Filter className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl mb-2">Aucun cours trouvé</h3>
              <p className="text-muted-foreground">
                Essayez de modifier vos filtres ou votre recherche
              </p>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
