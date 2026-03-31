import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { Plus, Edit, Trash2, X, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { coursesApi } from '../../../api/courses.api';

interface Category {
  id: string;
  name: string;
  slug: string;
}

export function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCategories = async () => {
    try {
      const data = await coursesApi.getCategories();
      setCategories(data);
    } catch {
      toast.error('Impossible de charger les catégories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const openCreate = () => {
    setEditing(null);
    setNameInput('');
    setModalOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setNameInput(cat.name);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setNameInput('');
    setEditing(null);
  };

  const handleSave = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) { toast.error('Le nom est requis'); return; }
    setSaving(true);
    try {
      if (editing) {
        const updated = await coursesApi.updateCategory(editing.id, trimmed);
        setCategories(cats => cats.map(c => c.id === editing.id ? updated : c));
        toast.success('Catégorie modifiée');
      } else {
        const created = await coursesApi.createCategory(trimmed);
        setCategories(cats => [...cats, created]);
        toast.success('Catégorie ajoutée');
      }
      closeModal();
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await coursesApi.deleteCategory(deleteTarget.id);
      setCategories(cats => cats.filter(c => c.id !== deleteTarget.id));
      toast.success('Catégorie supprimée');
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1>Gestion des catégories</h1>
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Ajouter une catégorie
          </button>
        </div>

        {/* List */}
        {loading ? (
          <div className="text-muted-foreground text-sm py-12 text-center">Chargement…</div>
        ) : categories.length === 0 ? (
          <div className="bg-white border border-border rounded-xl p-12 text-center">
            <Tag className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Aucune catégorie. Créez la première !</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {categories.map(cat => (
              <div key={cat.id} className="bg-white border border-indigo-100 border-l-4 border-l-indigo-400 rounded-xl p-5 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                    <Tag className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-medium">{cat.name}</p>
                    <p className="text-xs text-muted-foreground">{cat.slug}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEdit(cat)}
                    className="p-2 hover:bg-accent rounded-lg transition"
                    title="Modifier"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(cat)}
                    className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {editing ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
              </h2>
              <button onClick={closeModal} className="p-1 hover:bg-accent rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Nom *</label>
              <input
                autoFocus
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSave()}
                placeholder="Ex: Développement Web"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={closeModal}
                className="px-4 py-2 rounded-lg border border-border hover:bg-accent transition text-sm"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition text-sm disabled:opacity-60"
              >
                {saving ? 'Enregistrement…' : editing ? 'Enregistrer' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6 space-y-4">
            <h2 className="text-lg font-semibold">Supprimer la catégorie</h2>
            <p className="text-sm text-muted-foreground">
              Voulez-vous vraiment supprimer <strong>{deleteTarget.name}</strong> ?
              Cette action est irréversible.
            </p>
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-lg border border-border hover:bg-accent transition text-sm"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition text-sm disabled:opacity-60"
              >
                {deleting ? 'Suppression…' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
