import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { categoriesAPI } from '@/services/api';
import type { Category } from '@/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  category?: Category;
  onSuccess?: () => void;
}

const EMOJI_ICONS = [
  '🛒', '🍽️', '🚗', '🛍️', '📄', '🏠', '⚕️', '⚽', '🎬', '✈️',
  '👕', '💻', '📚', '🎁', '💰', '📌', '☕', '🎮', '🎵', '🏋️',
  '🚌', '⛽', '📱', '🍕', '🍔', '🥗', '🍺', '🎨', '📷', '🐕',
];

const PRESET_COLORS = [
  '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
];

export default function CategoryModal({ isOpen, onClose, category, onSuccess }: Props) {
  const [formData, setFormData] = useState({
    name: '',
    icon: '📌',
    color: '#3B82F6',
    description: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        icon: category.icon || '📌',
        color: category.color,
        description: category.description || '',
      });
    }
  }, [category]);

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

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center rounded-t-3xl">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {category ? 'Modifica Categoria' : 'Nuova Categoria'}
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              <XMarkIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            {/* Nome */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Nome Categoria *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Es: Spese mediche"
              />
            </div>

            {/* Icona */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Icona
              </label>
              <div className="grid grid-cols-10 gap-2">
                {EMOJI_ICONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon: emoji })}
                    className={`p-2 text-2xl rounded-lg transition-all ${
                      formData.icon === emoji
                        ? 'bg-primary-100 dark:bg-primary-900 ring-2 ring-primary-500'
                        : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Colore */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Colore
              </label>
              <div className="grid grid-cols-5 gap-3">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={`h-12 rounded-xl transition-all ${
                      formData.color === color
                        ? 'ring-4 ring-offset-2 ring-slate-400 dark:ring-slate-500'
                        : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="mt-3 w-full h-12 rounded-xl cursor-pointer"
              />
            </div>

            {/* Descrizione */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Descrizione
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Opzionale..."
              />
            </div>

            {/* Anteprima */}
            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Anteprima:</p>
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg"
                style={{ backgroundColor: `${formData.color}20` }}
              >
                <span className="text-2xl">{formData.icon}</span>
                <span className="font-medium" style={{ color: formData.color }}>
                  {formData.name || 'Nome categoria'}
                </span>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors font-medium"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all font-medium disabled:opacity-50 shadow-lg"
              >
                {isLoading ? 'Salvataggio...' : category ? 'Aggiorna' : 'Crea'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
