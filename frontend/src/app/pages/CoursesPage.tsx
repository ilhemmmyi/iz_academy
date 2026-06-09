import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Search, Filter, Clock, Layers, BookOpen, ArrowRight } from 'lucide-react';
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

  const categories = ['all', ...new Set(allCourses.map((c: any) => c.category?.name).filter(Boolean))];
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
      <div
        className="relative overflow-hidden py-12 px-4"
        style={{
          background: `
            radial-gradient(circle at 80% 50%, rgba(139,127,255,0.22) 0%, transparent 60%),
            radial-gradient(circle at 0% 100%, rgba(139,127,255,0.18) 0%, transparent 55%),
            linear-gradient(180deg,#ffffff 0%,#f7f7ff 60%,#f1f3ff 100%)
          `,
        }}
      >
        {/* Dotted grid overlay */}
        <div
          aria-hidden="true"
          className="absolute pointer-events-none select-none"
          style={{
            top: 0, right: 0, width: '70%', height: '100%',
            backgroundImage: 'radial-gradient(rgba(139,127,255,0.25) 1.5px, transparent 1.5px)',
            backgroundSize: '18px 18px',
            maskImage: 'radial-gradient(ellipse 80% 80% at 92% 18%, black 25%, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 92% 18%, black 25%, transparent 75%)',
          }}
        />
        <div className="relative max-w-7xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl mb-3 text-gray-900">Tous nos cours</h1>
          <p className="text-base text-gray-500 max-w-2xl mx-auto">
            Découvrez notre catalogue complet de formations et trouvez celle qui vous correspond
          </p>
        </div>
      </div>

      {/* Filtres et Recherche */}
      <div className="bg-white border-b border-border sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Rechercher un cours..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="w-full sm:w-52">
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

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredCourses.map((course: any) => {
              const lessonCount = course.modules?.reduce(
                (acc: number, m: any) => acc + (m._count?.lessons ?? 0), 0
              ) ?? 0;
              return (
                <Link
                  key={course.id}
                  to={`/course/${course.id}`}
                  className="bg-card border border-border rounded-xl overflow-hidden transition-all duration-300 hover:shadow-[0_0_35px_rgba(56,82,233,0.4)] group flex flex-col"
                >
                  <div className="aspect-video bg-muted overflow-hidden relative">
                    <img
                      src={course.thumbnailUrl}
                      alt={course.title}
                      className="w-full h-full object-contain group-hover:scale-105 transition duration-300"
                    />
                    {course.level && (
                      <span className="absolute top-2 right-2">
                        <Badge variant="secondary" className="text-xs">{course.level}</Badge>
                      </span>
                    )}
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {course.category?.name && (
                        <Badge variant="outline" className="text-xs">{course.category.name}</Badge>
                      )}
                    </div>
                    <h3 className="font-semibold text-base mb-1 line-clamp-1">{course.title}</h3>
                    <p className="text-muted-foreground text-sm mb-3 line-clamp-2 flex-1">
                      {course.shortDescription}
                    </p>
                    {course.teacher?.name && (
                      <div className="text-xs text-muted-foreground mb-3">
                        Par <span className="font-medium text-foreground">{course.teacher.name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4 flex-wrap">
                      {course.duration && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {course.duration}
                        </span>
                      )}
                      {course.modules?.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Layers className="w-3 h-3" />
                          {course.modules.length} module{course.modules.length > 1 ? 's' : ''}
                        </span>
                      )}
                      {lessonCount > 0 && (
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          {lessonCount} leçon{lessonCount > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <span className="font-semibold text-base">
                        {course.price ? `${course.price} DT` : 'Gratuit'}
                      </span>
                      <span className="text-primary flex items-center gap-1 text-sm font-medium">
                        Voir le cours
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
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
