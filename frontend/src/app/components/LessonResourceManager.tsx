import { useState, useRef } from 'react';
import type React from 'react';
import { Trash2, PlusCircle, Link2, FileText, X, Paperclip, ExternalLink, Download } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { lessonResourcesApi, LessonResource } from '../../api/lessonResources.api';

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  /** undefined = lesson not yet saved (create mode) — uploads done after save */
  lessonId?: string;
  /** Resources fetched from DB (edit mode) or pending list (create mode) */
  resources: LessonResource[];
  onResourcesChange: (resources: LessonResource[]) => void;
  /** Pending items to be committed after the lesson is created (create mode) */
  pendingFiles?: PendingFile[];
  onPendingFilesChange?: (files: PendingFile[]) => void;
}

export interface PendingFile {
  _localId: string;
  title: string;
  type: 'FILE' | 'LINK';
  file?: File;   // only for FILE type
  url?: string;  // only for LINK type
}

const RESOURCE_TYPE_ICON: Record<string, React.ReactElement> = {
  FILE: <FileText className="w-4 h-4 text-indigo-600" />,
  LINK: <Link2 className="w-4 h-4 text-emerald-600" />,
};

// ─── Component ────────────────────────────────────────────────────────────────
export function LessonResourceManager({ lessonId, resources, onResourcesChange, pendingFiles = [], onPendingFilesChange }: Props) {
  const [inputType, setInputType] = useState<'FILE' | 'LINK'>('FILE');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setTitle('');
    setUrl('');
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── In-DB mode (edit — lessonId known) ───────────────────────────────────
  const handleAddPersisted = async () => {
    if (!lessonId || uploading) return;
    if (!title.trim()) { toast.error('Le titre est requis'); return; }
    if (inputType === 'FILE' && !file) { toast.error('Veuillez choisir un fichier'); return; }
    if (inputType === 'LINK' && !url.trim()) { toast.error("L'URL est requise"); return; }
    setUploading(true);
    try {
      let created: LessonResource;
      if (inputType === 'FILE') {
        created = await lessonResourcesApi.uploadFile(lessonId, title.trim(), file!);
      } else {
        created = await lessonResourcesApi.addLink(lessonId, title.trim(), url.trim());
      }
      onResourcesChange([...resources, created]);
      resetForm();
      toast.success('Ressource ajoutée');
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'ajout");
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePersisted = async (id: string) => {
    try {
      await lessonResourcesApi.deleteResource(id);
      onResourcesChange(resources.filter(r => r.id !== id));
      toast.success('Ressource supprimée');
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  // ── Pending mode (create — lessonId not yet known) ────────────────────────
  const handleAddPending = () => {
    if (!title.trim()) { toast.error('Le titre est requis'); return; }
    if (inputType === 'FILE' && !file) { toast.error('Veuillez choisir un fichier'); return; }
    if (inputType === 'LINK' && !url.trim()) { toast.error("L'URL est requise"); return; }
    const item: PendingFile = {
      _localId: Date.now().toString() + Math.random(),
      title: title.trim(),
      type: inputType,
      ...(inputType === 'FILE' ? { file: file! } : { url: url.trim() }),
    };
    onPendingFilesChange?.([...pendingFiles, item]);
    resetForm();
    toast.success('Ressource ajoutée (sera sauvegardée avec la leçon)');
  };

  const handleRemovePending = (localId: string) => {
    onPendingFilesChange?.(pendingFiles.filter(p => p._localId !== localId));
  };

  const handleAdd = lessonId ? handleAddPersisted : handleAddPending;
  const combinedItems = lessonId ? resources : pendingFiles;

  return (
    <div className="space-y-4">
      {/* Form */}
      <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-4 space-y-3">
        {/* Type selector */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setInputType('FILE')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${inputType === 'FILE' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-muted-foreground border-border hover:bg-accent'}`}
          >
            <Paperclip className="w-3.5 h-3.5" /> Fichier
          </button>
          <button
            type="button"
            onClick={() => setInputType('LINK')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${inputType === 'LINK' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-muted-foreground border-border hover:bg-accent'}`}
          >
            <Link2 className="w-3.5 h-3.5" /> Lien
          </button>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <Label className="text-xs">Titre de la ressource *</Label>
          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder={inputType === 'FILE' ? 'Ex: Cours PDF Chapitre 1' : 'Ex: Documentation officielle'}
            className="text-sm"
          />
        </div>

        {/* File or URL */}
        {inputType === 'FILE' ? (
          <div className="space-y-1">
            <Label className="text-xs">Fichier *</Label>
            <div className="flex items-center gap-2">
              <label className="flex-1 cursor-pointer flex items-center gap-2 px-3 py-2 border border-border rounded-lg bg-white hover:bg-accent transition text-sm">
                <Paperclip className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="truncate text-muted-foreground text-xs">
                  {file ? file.name : 'Choisir un fichier (PDF, doc, image…)'}
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={e => setFile(e.target.files?.[0] || null)}
                />
              </label>
              {file && (
                <button type="button" onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="p-2 hover:bg-accent rounded-lg transition">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <Label className="text-xs">URL *</Label>
            <Input
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://..."
              className="text-sm"
              type="url"
            />
          </div>
        )}

        <Button
          type="button"
          size="sm"
          onClick={handleAdd}
          disabled={uploading}
          className="flex items-center gap-2"
        >
          <PlusCircle className="w-4 h-4" />
          {uploading ? 'Upload...' : 'Ajouter'}
        </Button>
      </div>

      {/* List */}
      {combinedItems.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            {combinedItems.length} ressource{combinedItems.length > 1 ? 's' : ''}
            {!lessonId && ' (en attente)'}
          </p>
          {lessonId
            ? resources.map(r => (
                <div key={r.id} className="flex items-center gap-3 p-3 bg-white border border-indigo-100 rounded-lg">
                  <div className="p-1.5 bg-indigo-50 rounded-md flex-shrink-0">
                    {RESOURCE_TYPE_ICON[r.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{r.title}</p>
                    <p className="text-xs text-muted-foreground">{r.type === 'FILE' ? 'Fichier' : 'Lien'}</p>
                  </div>
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-accent rounded-lg transition text-muted-foreground" title="Ouvrir">
                    {r.type === 'FILE' ? <Download className="w-4 h-4" /> : <ExternalLink className="w-4 h-4" />}
                  </a>
                  <button type="button" onClick={() => handleDeletePersisted(r.id)} className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition" title="Supprimer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            : pendingFiles.map(p => (
                <div key={p._localId} className="flex items-center gap-3 p-3 bg-white border border-dashed border-indigo-200 rounded-lg">
                  <div className="p-1.5 bg-indigo-50 rounded-md flex-shrink-0">
                    {RESOURCE_TYPE_ICON[p.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.type === 'FILE' ? p.file?.name : p.url}
                    </p>
                  </div>
                  <button type="button" onClick={() => handleRemovePending(p._localId)} className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
          }
        </div>
      )}
    </div>
  );
}
