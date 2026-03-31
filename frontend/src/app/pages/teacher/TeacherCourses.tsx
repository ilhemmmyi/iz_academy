import { TeacherLayout } from '../../components/TeacherLayout';
import { Link } from 'react-router';
import { BookOpen, Users, FileText } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { useState, useEffect } from 'react';
import { coursesApi } from '../../../api/courses.api';

export function TeacherCourses() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    coursesApi.getAll()
      .then(data => setCourses(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const activeCourses = courses.filter(c => c.isPublished);
  const draftCourses = courses.filter(c => !c.isPublished);

  const CourseCard = ({ course }: { course: any }) => (
    <Card className={`border-l-4 shadow-sm ${
      course.isPublished ? 'border-l-teal-400 border-teal-100' : 'border-l-amber-400 border-amber-100'
    }`}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between gap-4">
          {/* Left: title + meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge className={`text-xs font-medium border ${
                course.isPublished ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {course.isPublished ? 'Publié' : 'Brouillon'}
              </Badge>
              {course.category?.name && (
                <span className="text-xs text-muted-foreground">{course.category.name}</span>
              )}
            </div>
            <h3 className="truncate font-semibold">{course.title}</h3>
            {course.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{course.description}</p>
            )}
          </div>

          {/* Center: stats */}
          <div className="flex items-center gap-8 flex-shrink-0">
            <div className="text-center">
              <div className="text-xl font-bold text-green-600">{course.modules?.length || 0}</div>
              <div className="text-xs text-muted-foreground">Modules</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-primary">
                {course.modules?.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0) || 0}
              </div>
              <div className="text-xs text-muted-foreground">Leçons</div>
            </div>
          </div>

          {/* Right: action */}
          <div className="flex-shrink-0">
            <Button asChild>
              <Link to={`/teacher/course/${course.id}`}>
                <BookOpen className="w-4 h-4 mr-2" />
                Voir le cours
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <TeacherLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="mb-2">Mes cours</h1>
          <p className="text-muted-foreground">Consultez et gérez vos cours</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-indigo-400 border-indigo-100 shadow-sm">
            <CardContent className="pt-6 flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-indigo-600 mb-1">{loading ? '…' : courses.length}</div>
                <div className="text-sm text-muted-foreground">Total cours</div>
              </div>
              <div className="p-3 bg-indigo-50 rounded-lg">
                <BookOpen className="w-7 h-7 text-indigo-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-teal-400 border-teal-100 shadow-sm">
            <CardContent className="pt-6 flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-teal-600 mb-1">{loading ? '…' : activeCourses.length}</div>
                <div className="text-sm text-muted-foreground">Cours publiés</div>
              </div>
              <div className="p-3 bg-teal-50 rounded-lg">
                <Users className="w-7 h-7 text-teal-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-amber-400 border-amber-100 shadow-sm">
            <CardContent className="pt-6 flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-amber-600 mb-1">{loading ? '…' : draftCourses.length}</div>
                <div className="text-sm text-muted-foreground">Brouillons</div>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg">
                <FileText className="w-7 h-7 text-amber-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Course list */}
        <Tabs defaultValue="active">
          <TabsList>
            <TabsTrigger value="active">Publiés ({activeCourses.length})</TabsTrigger>
            <TabsTrigger value="draft">Brouillons ({draftCourses.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-6 space-y-4">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Chargement…</div>
            ) : activeCourses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Aucun cours publié.</div>
            ) : (
              activeCourses.map(course => <CourseCard key={course.id} course={course} />)
            )}
          </TabsContent>

          <TabsContent value="draft" className="mt-6 space-y-4">
            {draftCourses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Aucun brouillon.</div>
            ) : (
              draftCourses.map(course => <CourseCard key={course.id} course={course} />)
            )}
          </TabsContent>
        </Tabs>
      </div>
    </TeacherLayout>
  );
}