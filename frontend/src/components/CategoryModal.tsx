import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, SparklesIcon, PlusIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { categoriesAPI } from '@/services/api';
import { ICON_CATEGORIES, suggestIcon } from '@/utils/categoryIcons';
import type { Category } from '@/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  category?: Category;
  onSuccess?: () => void;
  initialName?: string;
}

const PRESET_COLORS = [
  '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
];

export default function CategoryModal({ isOpen, onClose, category, onSuccess, initialName }: Props) {
  const [formData, setFormData] = useState({
    name: '',
    icon: '📌',
    color: '#3B82F6',
    description: '',
    tags: [] as string[],
  });

  const [newTag, setNewTag] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [iconSearch, setIconSearch] = useState('');
  const [activeIconCategory, setActiveIconCategory] = useState<string>('Cibo & Bevande');

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        icon: category.icon || '📌',
        color: category.color,
        description: category.description || '',
        tags: (category as any).tags || [],
      });
    } else {
      setFormData({
        name: initialName || '',
        icon: '📌',
        color: '#3B82F6',
        description: '',
        tags: [],
      });
    }
  }, [category, isOpen, initialName]);

  // Auto-suggest icon quando cambia il nome
  useEffect(() => {
    if (!category && formData.name && formData.icon === '📌') {
      const suggested = suggestIcon(formData.name);
      if (suggested !== '📌') {
        setFormData(prev => ({ ...prev, icon: suggested }));
      }
    }
  }, [formData.name, category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (category) {
        await categoriesAPI.update(category.id, formData);
      } else {
        await categoriesAPI.create(formData);
      }
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Errore durante il salvataggio');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, newTag.trim()] }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  if (!isOpen) return null;

  // Filtra icone in base alla ricerca
  const currentIcons = iconSearch
    ? Object.values(ICON_CATEGORIES).flat().filter((icon) =>
        // Cerca nell'emoji stessa (non ideale ma funziona)
        icon.includes(iconSearch)
      )
    : ICON_CATEGORIES[activeIconCategory as keyof typeof ICON_CATEGORIES] || [];

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-modal dark:glass-modal-dark rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 glass-nav dark:glass-nav-dark px-6 py-4 flex justify-between items-center rounded-t-3xl z-10">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              {category ? '✏️ Modifica Categoria' : '➕ Nuova Categoria'}
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              <XMarkIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
                ⚠️ {error}
              </div>
            )}

            {/* Nome */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                📝 Nome Categoria *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="glass-input dark:glass-input-dark w-full px-4 py-3 rounded-2xl transition-all"
                placeholder="Es: Spesa Alimentare"
              />
            </div>

            {/* Icona */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {formData.icon} Icona
                </label>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, icon: suggestIcon(formData.name) })}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 glass-button rounded-xl hover:scale-105 transition-all"
                >
                  <SparklesIcon className="w-4 h-4" />
                  Auto-suggerisci
                </button>
              </div>

              {/* Categorie Icone */}
              <div className="flex flex-wrap gap-2 mb-3">
                {Object.keys(ICON_CATEGORIES).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveIconCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      activeIconCategory === cat
                        ? 'glass-card dark:glass-card-dark ring-2 ring-primary-500'
                        : 'glass-button hover:scale-102'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Griglia Icone */}
              <div className="glass-card dark:glass-card-dark rounded-2xl p-4 max-h-64 overflow-y-auto">
                <div className="grid grid-cols-8 gap-2">
                  {currentIcons.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon })}
                      className={`text-2xl p-2 rounded-xl transition-all hover:scale-110 ${
                        formData.icon === icon
                          ? 'bg-primary-100 dark:bg-primary-900 ring-2 ring-primary-500'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Colore */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                🎨 Colore
              </label>
              <div className="flex flex-wrap gap-3 mb-3">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-10 h-10 rounded-xl transition-all hover:scale-110 ${
                      formData.color === color ? 'ring-2 ring-offset-2 ring-slate-900 dark:ring-slate-100' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="flex gap-3 items-center">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="h-10 w-20 rounded-xl cursor-pointer border-2 border-slate-300 dark:border-slate-600"
                />
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="glass-input dark:glass-input-dark flex-1 px-4 py-2 rounded-xl text-sm"
                  placeholder="#3B82F6"
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                🏷️ Tags (opzionale)
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  className="glass-input dark:glass-input-dark flex-1 px-4 py-2 rounded-xl text-sm"
                  placeholder="Aggiungi un tag..."
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="glass-button px-4 py-2 rounded-xl hover:scale-105 transition-all"
                >
                  <PlusIcon className="w-5 h-5" />
                </button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="glass-card dark:glass-card-dark px-3 py-1.5 rounded-xl text-sm flex items-center gap-2"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-red-500 transition-colors"
                      >
                        <XCircleIcon className="w-4 h-4" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Descrizione */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                📄 Descrizione (opzionale)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="glass-input dark:glass-input-dark w-full px-4 py-3 rounded-2xl transition-all resize-none"
                placeholder="Note aggiuntive..."
              />
            </div>

            {/* Preview */}
            <div className="glass-card dark:glass-card-dark rounded-2xl p-4">
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">👁️ Anteprima:</p>
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                  style={{ backgroundColor: `${formData.color}20` }}
                >
                  {formData.icon}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {formData.name || 'Nome Categoria'}
                  </p>
                  {formData.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-1">
                      {formData.description}
                    </p>
                  )}
                  {formData.tags.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {formData.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-xs px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: formData.color }}
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 glass-button rounded-2xl font-medium transition-all hover:scale-102"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-3 liquid-gradient text-white rounded-2xl font-medium soft-shadow-lg hover:scale-102 transition-all disabled:opacity-50"
              >
                {isLoading ? '⏳ Salvataggio...' : category ? '✅ Aggiorna' : '➕ Crea'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
