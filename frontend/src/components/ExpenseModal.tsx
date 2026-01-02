import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useDataStore } from '@/store/dataStore';
import { expensesAPI } from '@/services/api';
import type { Expense, CreateExpenseDTO } from '@/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  expense?: Expense;
  onSuccess?: () => void;
}

export default function ExpenseModal({ isOpen, onClose, expense, onSuccess }: Props) {
  const { accounts, categories, fetchAccounts, fetchCategories } = useDataStore();

  const [formData, setFormData] = useState<CreateExpenseDTO>({
    amount: 0,
    type: 'EXPENSE',
    description: '',
    notes: '',
    date: new Date().toISOString().split('T')[0],
    accountId: '',
    categoryId: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAccounts();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (expense) {
      setFormData({
        amount: Number(expense.amount),
        type: expense.type,
        description: expense.description,
        notes: expense.notes || '',
        date: expense.date.split('T')[0],
        accountId: expense.account.id,
        categoryId: expense.category.id,
      });
    } else {
      // Default: primo account disponibile
      if (accounts.length > 0 && !formData.accountId) {
        setFormData(prev => ({ ...prev, accountId: accounts[0].id }));
      }
      if (categories.length > 0 && !formData.categoryId) {
        setFormData(prev => ({ ...prev, categoryId: categories[0].id }));
      }
    }
  }, [expense, accounts, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (expense) {
        await expensesAPI.update(expense.id, formData);
      } else {
        await expensesAPI.create(formData);
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
          className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center rounded-t-3xl">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {expense ? 'Modifica Spesa' : 'Nuova Spesa'}
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

            {/* Tipo */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Tipo
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'EXPENSE' })}
                  className={`px-4 py-3 rounded-xl font-medium transition-all ${
                    formData.type === 'EXPENSE'
                      ? 'bg-red-500 text-white shadow-lg'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  💸 Spesa
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'INCOME' })}
                  className={`px-4 py-3 rounded-xl font-medium transition-all ${
                    formData.type === 'INCOME'
                      ? 'bg-green-500 text-white shadow-lg'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  💰 Entrata
                </button>
              </div>
            </div>

            {/* Importo */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Importo *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>

            {/* Descrizione */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Descrizione *
              </label>
              <input
                type="text"
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Es: Spesa al supermercato"
              />
            </div>

            {/* Account */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Conto *
              </label>
              <select
                required
                value={formData.accountId}
                onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Seleziona conto</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Categoria */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Categoria *
              </label>
              <select
                required
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Seleziona categoria</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Data */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Data *
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Note */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Note
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Aggiungi dettagli..."
              />
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
                {isLoading ? 'Salvataggio...' : expense ? 'Aggiorna' : 'Crea'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
