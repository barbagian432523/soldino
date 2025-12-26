import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { useDataStore } from '@/store/dataStore';
import { formatCurrency, formatDateShort } from '@/utils/format';
import Layout from '@/components/Layout';
import type { ExpenseFilters } from '@/types';

export default function Expenses() {
  const {
    expenses,
    categories,
    accounts,
    fetchExpenses,
    fetchCategories,
    fetchAccounts,
    isLoadingExpenses,
  } = useDataStore();

  const [filters, setFilters] = useState<ExpenseFilters>({
    search: '',
    categoryId: '',
    accountId: '',
    type: undefined,
  });

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchAccounts();
    fetchExpenses();
  }, []);

  const handleSearch = () => {
    fetchExpenses(filters);
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      categoryId: '',
      accountId: '',
      type: undefined,
    });
    fetchExpenses();
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Spese</h2>
            <p className="text-slate-600 mt-1">
              Gestisci tutte le tue transazioni
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Nuova Spesa</span>
          </motion.button>
        </div>

        {/* Ricerca e Filtri */}
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Cerca per descrizione, note o luogo..."
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-3 border rounded-xl flex items-center gap-2 transition-colors ${
                showFilters
                  ? 'bg-primary-50 border-primary-300 text-primary-700'
                  : 'border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <FunnelIcon className="w-5 h-5" />
              <span>Filtri</span>
            </button>

            <button
              onClick={handleSearch}
              className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium"
            >
              Cerca
            </button>
          </div>

          {/* Filtri avanzati */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-200"
            >
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Categoria
                </label>
                <select
                  value={filters.categoryId}
                  onChange={(e) =>
                    setFilters({ ...filters, categoryId: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Tutte</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Conto
                </label>
                <select
                  value={filters.accountId}
                  onChange={(e) =>
                    setFilters({ ...filters, accountId: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Tutti</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tipo
                </label>
                <select
                  value={filters.type || ''}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      type: e.target.value as any,
                    })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Tutti</option>
                  <option value="EXPENSE">Spese</option>
                  <option value="INCOME">Entrate</option>
                </select>
              </div>

              <div className="md:col-span-3 flex justify-end">
                <button
                  onClick={handleResetFilters}
                  className="text-slate-600 hover:text-slate-800 text-sm font-medium"
                >
                  Resetta filtri
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Lista spese */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          {isLoadingExpenses ? (
            <div className="text-center py-12">
              <div className="inline-block w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-slate-600">Caricamento spese...</p>
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-600 mb-4">Nessuna spesa trovata</p>
              <p className="text-sm text-slate-500">
                Prova a modificare i filtri di ricerca
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {expenses.map((expense, index) => (
                <motion.div
                  key={expense.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ x: 5 }}
                  className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                      style={{
                        backgroundColor: `${expense.category.color}20`,
                      }}
                    >
                      {expense.category.icon || '📄'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-900 truncate">
                          {expense.description}
                        </p>
                        {expense.isAiGenerated && (
                          <span className="flex-shrink-0 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                            ✨ AI
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-sm text-slate-600">
                        <span>{expense.category.name}</span>
                        <span>•</span>
                        <span>{expense.account.name}</span>
                        <span>•</span>
                        <span>{formatDateShort(expense.date)}</span>
                      </div>
                      {expense.notes && (
                        <p className="text-sm text-slate-500 mt-1 truncate">
                          {expense.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 ml-4">
                    <p
                      className={`text-xl font-bold ${
                        expense.type === 'EXPENSE'
                          ? 'text-red-600'
                          : 'text-green-600'
                      }`}
                    >
                      {expense.type === 'EXPENSE' ? '-' : '+'}
                      {formatCurrency(Number(expense.amount))}
                    </p>
                    {expense.attachments && expense.attachments.length > 0 && (
                      <p className="text-xs text-slate-500 mt-1">
                        📎 {expense.attachments.length} allegati
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
