import { StudentLayout } from '../../components/StudentLayout';

export function StudentLevelTest() {
  return (
    <StudentLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="mb-2">Test de niveau</h1>
          <p className="text-muted-foreground">
            Accédez à votre test de niveau pour évaluer vos compétences.
          </p>
        </div>

        <div className="bg-white border border-border rounded-xl p-12 text-center">
          <p className="text-muted-foreground">Cette fonctionnalité sera bientôt disponible.</p>
        </div>
      </div>
    </StudentLayout>
  );
}