import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { accountsAPI } from '@/services/api';
import type { Account, AccountType } from '@/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  account?: Account;
  onSuccess?: () => void;
}

const accountTypes: { value: AccountType; label: string; icon: string; color: string }[] = [
  { value: 'CHECKING', label: '🏦 Conto Corrente', icon: '🏦', color: '#3B82F6' },
  { value: 'SAVINGS', label: '💰 Risparmio', icon: '💰', color: '#10B981' },
  { value: 'CASH', label: '💵 Contanti', icon: '💵', color: '#F59E0B' },
  { value: 'CREDIT_CARD', label: '💳 Carta di Credito', icon: '💳', color: '#EF4444' },
  { value: 'INVESTMENT', label: '📈 Investimenti', icon: '📈', color: '#8B5CF6' },
  { value: 'OTHER', label: '💼 Altro', icon: '💼', color: '#6B7280' },
];

export default function AccountModal({ isOpen, onClose, account, onSuccess }: Props) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'CHECKING' as AccountType,
    balance: '',
    currency: 'EUR',
    color: '#3B82F6',
    description: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name,
        type: account.type,
        balance: account.balance.toString(),
        currency: account.currency,
        color: account.color || '#3B82F6',
        description: account.description || '',
      });
    } else {
      setFormData({
        name: '',
        type: 'CHECKING',
        balance: '',
        currency: 'EUR',
        color: '#3B82F6',
        description: '',
      });
    }
  }, [account, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const data = {
        ...formData,
        balance: parseFloat(formData.balance) || 0,
      };

      if (account) {
        await accountsAPI.update(account.id, data);
      } else {
        await accountsAPI.create(data);
      }

      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Errore durante il salvataggio');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTypeChange = (type: AccountType) => {
    const typeInfo = accountTypes.find(t => t.value === type);
    setFormData({
      ...formData,
      type,
      color: typeInfo?.color || '#3B82F6',
    });
  };

  if (!isOpen) return null;

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
          className="glass-modal dark:glass-modal-dark rounded-3xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
              {account ? '✏️ Modifica Conto' : '➕ Nuovo Conto'}
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              <XMarkIcon className="w-6 h-6 text-slate-600 dark:text-slate-400" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nome */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                📝 Nome Conto *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="glass-input dark:glass-input-dark w-full px-4 py-3 rounded-2xl transition-all"
                placeholder="Es: Conto Principale"
              />
            </div>

            {/* Tipo */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                🏷️ Tipo di Conto *
              </label>
              <div className="grid grid-cols-2 gap-3">
                {accountTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleTypeChange(type.value)}
                    className={`p-3 rounded-2xl font-medium transition-all ${
                      formData.type === type.value
                        ? 'glass-card dark:glass-card-dark ring-2 ring-primary-500 scale-105'
                        : 'glass-button hover:scale-102'
                    }`}
                  >
                    <div className="text-2xl mb-1">{type.icon}</div>
                    <div className="text-xs text-slate-700 dark:text-slate-300">
                      {type.label.replace(type.icon + ' ', '')}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Saldo iniziale */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                💶 Saldo Iniziale *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.balance}
                  onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                  className="glass-input dark:glass-input-dark w-full px-4 py-3 rounded-2xl pr-12 transition-all"
                  placeholder="0.00"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 font-medium">
                  {formData.currency}
                </span>
              </div>
            </div>

            {/* Valuta */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                💱 Valuta
              </label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="glass-input dark:glass-input-dark w-full px-4 py-3 rounded-2xl transition-all"
              >
                <option value="EUR">🇪🇺 Euro (EUR)</option>
                <option value="USD">🇺🇸 Dollaro (USD)</option>
                <option value="GBP">🇬🇧 Sterlina (GBP)</option>
                <option value="CHF">🇨🇭 Franco (CHF)</option>
              </select>
            </div>

            {/* Colore */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                🎨 Colore
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="h-12 w-20 rounded-xl cursor-pointer border-2 border-slate-300 dark:border-slate-600"
                />
                <div
                  className="flex-1 h-12 rounded-xl"
                  style={{ backgroundColor: formData.color }}
                />
              </div>
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
                {isLoading ? '⏳ Salvataggio...' : account ? '✅ Aggiorna' : '➕ Crea'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
