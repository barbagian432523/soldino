import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline';
import { useDataStore } from '@/store/dataStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function TransferModal({ isOpen, onClose, onSuccess }: Props) {
  const { accounts, fetchAccounts } = useDataStore();

  const [formData, setFormData] = useState({
    fromAccountId: '',
    toAccountId: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.fromAccountId || !formData.toAccountId) {
      setError('Seleziona entrambi i conti');
      return;
    }

    if (formData.fromAccountId === formData.toAccountId) {
      setError('Non puoi trasferire denaro allo stesso conto');
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Inserisci un importo valido');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/accounts/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Errore durante il trasferimento');
      }

      onSuccess?.();
      onClose();

      // Reset form
      setFormData({
        fromAccountId: '',
        toAccountId: '',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
      });
    } catch (err: any) {
      setError(err.message || 'Errore durante il trasferimento');
    } finally {
      setIsLoading(false);
    }
  };

  const swapAccounts = () => {
    setFormData({
      ...formData,
      fromAccountId: formData.toAccountId,
      toAccountId: formData.fromAccountId,
    });
  };

  if (!isOpen) return null;

  const fromAccount = accounts.find(a => a.id === formData.fromAccountId);
  const toAccount = accounts.find(a => a.id === formData.toAccountId);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl shadow-lg">
                🔄
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Giroconto</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">Trasferisci tra i tuoi conti</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            {/* From Account */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Da Conto
              </label>
              <select
                required
                value={formData.fromAccountId}
                onChange={(e) => setFormData({ ...formData, fromAccountId: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              >
                <option value="">Seleziona conto di partenza</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.icon} {account.name} - {Number(account.balance).toFixed(2)}€
                  </option>
                ))}
              </select>
              {fromAccount && (
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Saldo disponibile: {Number(fromAccount.balance).toFixed(2)}€
                </p>
              )}
            </div>

            {/* Swap Button */}
            <div className="flex justify-center -my-3">
              <motion.button
                type="button"
                whileHover={{ scale: 1.1, rotate: 180 }}
                whileTap={{ scale: 0.9 }}
                onClick={swapAccounts}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow"
              >
                <ArrowsRightLeftIcon className="w-5 h-5" />
              </motion.button>
            </div>

            {/* To Account */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                A Conto
              </label>
              <select
                required
                value={formData.toAccountId}
                onChange={(e) => setFormData({ ...formData, toAccountId: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              >
                <option value="">Seleziona conto di destinazione</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.icon} {account.name} - {Number(account.balance).toFixed(2)}€
                  </option>
                ))}
              </select>
              {toAccount && (
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Saldo attuale: {Number(toAccount.balance).toFixed(2)}€
                </p>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Importo €
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-lg font-semibold"
                placeholder="0,00"
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Data
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Descrizione (opzionale)
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                placeholder="Es: Prelievo contanti, Versamento..."
              />
            </div>

            {/* Preview */}
            {formData.fromAccountId && formData.toAccountId && formData.amount && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4"
              >
                <p className="text-sm font-medium text-indigo-900 dark:text-indigo-300 mb-2">Riepilogo:</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-700 dark:text-slate-300">
                    {fromAccount?.icon} {fromAccount?.name}
                  </span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold">→ {formData.amount}€ →</span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {toAccount?.icon} {toAccount?.name}
                  </span>
                </div>
              </motion.div>
            )}

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
                className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all font-medium disabled:opacity-50 shadow-lg"
              >
                {isLoading ? 'Trasferimento...' : 'Trasferisci'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
