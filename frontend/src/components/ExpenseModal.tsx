import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, PlusCircleIcon, ArrowDownTrayIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useDataStore } from '@/store/dataStore';
import { expensesAPI } from '@/services/api';
import CategoryModal from './CategoryModal';
import type { Expense, CreateExpenseDTO } from '@/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  expense?: Expense;
  onSuccess?: () => void;
}

export default function ExpenseModal({ isOpen, onClose, expense, onSuccess }: Props) {
  const { accounts, categories, expenses, fetchAccounts, fetchCategories } = useDataStore();

  const [formData, setFormData] = useState<any>({
    amount: '',
    type: 'EXPENSE',
    description: '',
    notes: '',
    date: new Date().toISOString().split('T')[0],
    accountId: '',
    categoryId: '',
    // Recurring fields
    isRecurring: false,
    recurringFrequency: '',
    recurringStartDate: '',
    recurringEndDate: '',
  });

  const [attachments, setAttachments] = useState<File[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [categorySearch, setCategorySearch] = useState('');
  const [accountSearch, setAccountSearch] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [showDescriptionDropdown, setShowDescriptionDropdown] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

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
      // Set search values for editing
      const category = categories.find(c => c.id === expense.category.id);
      const account = accounts.find(a => a.id === expense.account.id);
      if (category) setCategorySearch(`${category.icon} ${category.name}`);
      if (account) setAccountSearch(`${account.name} (${account.type})`);
    } else {
      // Default: primo account disponibile
      if (accounts.length > 0 && !formData.accountId) {
        setFormData(prev => ({ ...prev, accountId: accounts[0].id }));
        setAccountSearch(`${accounts[0].name} (${accounts[0].type})`);
      }
      if (categories.length > 0 && !formData.categoryId) {
        setFormData(prev => ({ ...prev, categoryId: categories[0].id }));
        setCategorySearch(`${categories[0].icon} ${categories[0].name}`);
      }
    }
  }, [expense, accounts, categories]);

  // Filter categories based on search
  const filteredCategories = categories.filter(cat =>
    `${cat.icon} ${cat.name}`.toLowerCase().includes(categorySearch.toLowerCase())
  );

  // Filter accounts based on search
  const filteredAccounts = accounts.filter(acc =>
    `${acc.name} ${acc.type}`.toLowerCase().includes(accountSearch.toLowerCase())
  );

  // Get unique descriptions and filter based on current input
  const uniqueDescriptions = Array.from(new Set(expenses.map(e => e.description)));
  const filteredDescriptions = uniqueDescriptions.filter(desc =>
    desc.toLowerCase().includes(formData.description.toLowerCase()) &&
    desc.toLowerCase() !== formData.description.toLowerCase()
  ).slice(0, 5); // Limit to 5 suggestions

  const handleCategorySelect = (category: any) => {
    setFormData({ ...formData, categoryId: category.id });
    setCategorySearch(`${category.icon} ${category.name}`);
    setShowCategoryDropdown(false);
  };

  const handleAccountSelect = (account: any) => {
    setFormData({ ...formData, accountId: account.id });
    setAccountSearch(`${account.name} (${account.type})`);
    setShowAccountDropdown(false);
  };

  const handleCategoryCreated = async () => {
    // Refresh categories list
    await fetchCategories();

    // Find the newly created category by name
    const newCategory = categories.find(c => c.name === newCategoryName);
    if (newCategory) {
      handleCategorySelect(newCategory);
    }

    setShowCategoryModal(false);
    setNewCategoryName('');
  };

  const handleDownloadAttachment = async (id: string, originalName: string) => {
    try {
      const response = await fetch(`/api/attachments/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Download fallito');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = originalName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Errore download:', error);
      alert('Errore durante il download del file');
    }
  };

  const handleDeleteAttachment = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo allegato?')) return;

    try {
      const response = await fetch(`/api/attachments/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Eliminazione fallita');

      // Refresh expense data to update attachments list
      onSuccess?.();
    } catch (error) {
      console.error('Errore eliminazione:', error);
      alert('Errore durante l\'eliminazione del file');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const dataToSend = {
        ...formData,
        amount: parseFloat(formData.amount) || 0,
      };

      let expenseId: string;

      if (expense) {
        await expensesAPI.update(expense.id, dataToSend);
        expenseId = expense.id;
      } else {
        const response = await expensesAPI.create(dataToSend);
        expenseId = response.data.expense.id;
      }

      // Upload attachments se presenti
      if (attachments.length > 0) {
        const formDataUpload = new FormData();
        formDataUpload.append('expenseId', expenseId);
        attachments.forEach((file) => {
          formDataUpload.append('files', file);
        });

        await fetch('/api/attachments/upload', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: formDataUpload,
        });
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
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>

            {/* Descrizione */}
            <div className="relative">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Descrizione *
              </label>
              <input
                type="text"
                required
                value={formData.description}
                onChange={(e) => {
                  setFormData({ ...formData, description: e.target.value });
                  setShowDescriptionDropdown(e.target.value.length > 0);
                }}
                onFocus={() => setShowDescriptionDropdown(formData.description.length > 0)}
                onBlur={() => setTimeout(() => setShowDescriptionDropdown(false), 200)}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Es: Spesa al supermercato"
              />
              {showDescriptionDropdown && filteredDescriptions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {filteredDescriptions.map((desc, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, description: desc });
                        setShowDescriptionDropdown(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors text-slate-900 dark:text-white"
                    >
                      {desc}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Account */}
            <div className="relative">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Conto *
              </label>
              <input
                type="text"
                required
                value={accountSearch}
                onChange={(e) => {
                  setAccountSearch(e.target.value);
                  setShowAccountDropdown(true);
                }}
                onFocus={() => setShowAccountDropdown(true)}
                onBlur={() => setTimeout(() => setShowAccountDropdown(false), 200)}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Cerca o seleziona conto..."
              />
              {showAccountDropdown && filteredAccounts.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                  {filteredAccounts.map((acc) => (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => handleAccountSelect(acc)}
                      className="w-full text-left px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                    >
                      <div className="font-medium text-slate-900 dark:text-white">{acc.name}</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">{acc.type}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Categoria */}
            <div className="relative">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Categoria *
              </label>
              <input
                type="text"
                required
                value={categorySearch}
                onChange={(e) => {
                  setCategorySearch(e.target.value);
                  setShowCategoryDropdown(true);
                }}
                onFocus={() => setShowCategoryDropdown(true)}
                onBlur={() => setTimeout(() => setShowCategoryDropdown(false), 200)}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Cerca o seleziona categoria..."
              />
              {showCategoryDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                  {filteredCategories.length > 0 ? (
                    filteredCategories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleCategorySelect(cat)}
                        className="w-full text-left px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors flex items-center gap-3"
                      >
                        <span className="text-2xl">{cat.icon}</span>
                        <span className="font-medium text-slate-900 dark:text-white">{cat.name}</span>
                      </button>
                    ))
                  ) : categorySearch.trim().length > 0 ? (
                    <button
                      type="button"
                      onClick={() => {
                        setNewCategoryName(categorySearch);
                        setShowCategoryModal(true);
                        setShowCategoryDropdown(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors flex items-center gap-3 text-primary-600 dark:text-primary-400"
                    >
                      <PlusCircleIcon className="w-5 h-5" />
                      <span className="font-medium">➕ Crea categoria "{categorySearch}"</span>
                    </button>
                  ) : null}
                </div>
              )}
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

            {/* Ricorrenza */}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="checkbox"
                  id="isRecurring"
                  checked={formData.isRecurring}
                  onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <label htmlFor="isRecurring" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  🔄 Spesa ricorrente
                </label>
              </div>

              {formData.isRecurring && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ml-6">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Frequenza
                    </label>
                    <select
                      value={formData.recurringFrequency}
                      onChange={(e) => setFormData({ ...formData, recurringFrequency: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                    >
                      <option value="">Seleziona...</option>
                      <option value="DAILY">Giornaliera</option>
                      <option value="WEEKLY">Settimanale</option>
                      <option value="BIWEEKLY">Quindicinale</option>
                      <option value="MONTHLY">Mensile</option>
                      <option value="QUARTERLY">Trimestrale</option>
                      <option value="YEARLY">Annuale</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Inizio
                    </label>
                    <input
                      type="date"
                      value={formData.recurringStartDate}
                      onChange={(e) => setFormData({ ...formData, recurringStartDate: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Fine (opzionale)
                    </label>
                    <input
                      type="date"
                      value={formData.recurringEndDate}
                      onChange={(e) => setFormData({ ...formData, recurringEndDate: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Allegati */}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                📎 Allegati
              </label>

              {/* Allegati esistenti */}
              {expense?.attachments && expense.attachments.length > 0 && (
                <div className="mb-3 space-y-1">
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Allegati caricati:</p>
                  {expense.attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center justify-between text-xs bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-3 py-2 rounded-lg">
                      <span className="text-slate-700 dark:text-slate-300 truncate flex-1">
                        {attachment.originalName} ({(attachment.size / 1024).toFixed(1)} KB)
                      </span>
                      <div className="flex gap-2 ml-2">
                        <button
                          type="button"
                          onClick={() => handleDownloadAttachment(attachment.id, attachment.originalName)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 p-1"
                          title="Scarica"
                        >
                          <ArrowDownTrayIcon className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAttachment(attachment.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-1"
                          title="Elimina"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Input per nuovi allegati */}
              <div>
                <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">
                  Aggiungi nuovi allegati (max 10 file):
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setAttachments(files.slice(0, 10));
                  }}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 text-sm"
                />
              </div>

              {/* Nuovi allegati selezionati */}
              {attachments.length > 0 && (
                <div className="mt-2 space-y-1">
                  {attachments.map((file, index) => (
                    <div key={`new-${index}`} className="flex items-center justify-between text-xs bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg">
                      <span className="text-slate-700 dark:text-slate-300 truncate">
                        {file.name} ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                      <button
                        type="button"
                        onClick={() => setAttachments(attachments.filter((_, i) => i !== index))}
                        className="text-red-600 hover:text-red-700 ml-2"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
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

      {/* Category Modal for creating new categories on the fly */}
      <CategoryModal
        isOpen={showCategoryModal}
        onClose={() => {
          setShowCategoryModal(false);
          setNewCategoryName('');
        }}
        onSuccess={handleCategoryCreated}
        initialName={newCategoryName}
      />
    </AnimatePresence>
  );
}
