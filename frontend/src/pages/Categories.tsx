import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useDataStore } from '@/store/dataStore';
import { categoriesAPI } from '@/services/api';
import Layout from '@/components/Layout';
import CategoryModal from '@/components/CategoryModal';
import type { Category } from '@/types';

export default function Categories() {
  const { categories, fetchCategories, expenses } = useDataStore();
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>();

  useEffect(() => {
    fetchCategories();
  }, []);

  const getCategoryExpenseCount = (categoryId: string) => {
    return expenses.filter(e => e.categoryId === categoryId).length;
  };

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setShowCategoryModal(true);
  };

  const handleDelete = async (category: Category) => {
    const count = getCategoryExpenseCount(category.id);

    if (count > 0) {
      alert(`Impossibile eliminare: ci sono ${count} spese collegate a questa categoria`);
      return;
    }

    if (category.isDefault) {
      alert('Non puoi eliminare le categorie di sistema');
      return;
    }

    if (!confirm(`Sei sicuro di voler eliminare "${category.name}"?`)) {
      return;
    }

    try {
      await categoriesAPI.delete(category.id);
      fetchCategories();
    } catch (error) {
      alert('Errore durante l\'eliminazione');
    }
  };

  const handleModalClose = () => {
    setShowCategoryModal(false);
    setSelectedCategory(undefined);
  };

  const userCategories = categories.filter(c => !c.isDefault);
  const systemCategories = categories.filter(c => c.isDefault);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Categorie</h2>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Gestisci le categorie delle tue spese
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setSelectedCategory(undefined);
              setShowCategoryModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Nuova Categoria</span>
          </motion.button>
        </div>

        {/* Categorie Personalizzate */}
        {userCategories.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              Le tue categorie
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userCategories.map((category, index) => {
                const expenseCount = getCategoryExpenseCount(category.id);

                return (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="group relative border-2 rounded-xl p-4 hover:shadow-lg transition-all"
                    style={{ borderColor: category.color }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                        style={{ backgroundColor: `${category.color}20` }}
                      >
                        {category.icon}
                      </div>

                      {/* Pulsanti Edit/Delete */}
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(category)}
                          className="p-1.5 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                          title="Modifica"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(category)}
                          className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Elimina"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <h4
                      className="font-bold text-lg mb-1"
                      style={{ color: category.color }}
                    >
                      {category.name}
                    </h4>

                    {category.description && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                        {category.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                      <span className="text-xs text-slate-500 dark:text-slate-500">
                        Spese collegate
                      </span>
                      <span
                        className="text-sm font-bold px-2 py-1 rounded-lg"
                        style={{
                          backgroundColor: `${category.color}20`,
                          color: category.color,
                        }}
                      >
                        {expenseCount}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Categorie di Sistema */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
            Categorie predefinite
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {systemCategories.map((category, index) => {
              const expenseCount = getCategoryExpenseCount(category.id);

              return (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="relative border rounded-xl p-3 hover:shadow-md transition-all cursor-default"
                  style={{ borderColor: `${category.color}40` }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{category.icon}</span>
                    <span
                      className="font-medium text-sm flex-1 truncate"
                      style={{ color: category.color }}
                    >
                      {category.name}
                    </span>
                  </div>

                  <div className="text-right">
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `${category.color}15`,
                        color: category.color,
                      }}
                    >
                      {expenseCount} spese
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {userCategories.length === 0 && (
          <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-2xl p-6 text-center">
            <p className="text-primary-800 dark:text-primary-300 font-medium">
              💡 Non hai ancora creato categorie personalizzate
            </p>
            <p className="text-primary-600 dark:text-primary-400 text-sm mt-2">
              Clicca su "Nuova Categoria" per crearne una su misura per te!
            </p>
          </div>
        )}
      </div>

      {/* Modal Categoria */}
      <CategoryModal
        isOpen={showCategoryModal}
        onClose={handleModalClose}
        category={selectedCategory}
        onSuccess={() => {
          fetchCategories();
        }}
      />
    </Layout>
  );
}
