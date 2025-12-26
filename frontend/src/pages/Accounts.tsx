import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useDataStore } from '@/store/dataStore';
import { formatCurrency, getAccountTypeLabel } from '@/utils/format';
import Layout from '@/components/Layout';

const accountTypeIcons: Record<string, string> = {
  CHECKING: '🏦',
  SAVINGS: '💰',
  CASH: '💵',
  CREDIT_CARD: '💳',
  INVESTMENT: '📈',
  OTHER: '💼',
};

export default function Accounts() {
  const { accounts, fetchAccounts, isLoadingAccounts } = useDataStore();

  useEffect(() => {
    fetchAccounts();
  }, []);

  const totalBalance = accounts.reduce(
    (sum, acc) => sum + Number(acc.balance),
    0
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Conti</h2>
            <p className="text-slate-600 mt-1">
              Gestisci i tuoi conti e portafogli
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Nuovo Conto</span>
          </motion.button>
        </div>

        {/* Saldo totale */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-3xl p-8 text-white shadow-2xl"
        >
          <p className="text-primary-100 text-sm font-medium mb-2">
            Saldo Totale
          </p>
          <p className="text-5xl font-bold mb-4">
            {formatCurrency(totalBalance)}
          </p>
          <div className="flex items-center gap-6 text-sm">
            <div>
              <p className="text-primary-100">Conti attivi</p>
              <p className="font-semibold text-lg">{accounts.length}</p>
            </div>
            <div className="h-8 w-px bg-primary-400" />
            <div>
              <p className="text-primary-100">Portafogli contanti</p>
              <p className="font-semibold text-lg">
                {accounts.filter((a) => a.type === 'CASH').length}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Lista conti */}
        {isLoadingAccounts ? (
          <div className="text-center py-12">
            <div className="inline-block w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-slate-600">Caricamento conti...</p>
          </div>
        ) : accounts.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">💳</div>
            <p className="text-slate-600 mb-4 text-lg">
              Nessun conto configurato
            </p>
            <p className="text-sm text-slate-500 mb-6">
              Crea il tuo primo conto per iniziare a tracciare le spese
            </p>
            <button className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-medium hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg">
              Crea il primo conto
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accounts.map((account, index) => (
              <motion.div
                key={account.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer group"
              >
                {/* Header colorato */}
                <div
                  className="p-6 text-white"
                  style={{
                    background: `linear-gradient(135deg, ${
                      account.color || '#3B82F6'
                    }, ${account.color || '#3B82F6'}DD)`,
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-4xl">
                      {account.icon || accountTypeIcons[account.type] || '💼'}
                    </div>
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium">
                      {getAccountTypeLabel(account.type)}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold mb-1">{account.name}</h3>
                  {account.description && (
                    <p className="text-sm opacity-90">{account.description}</p>
                  )}
                </div>

                {/* Body */}
                <div className="p-6">
                  <div className="mb-4">
                    <p className="text-sm text-slate-600 mb-1">
                      Saldo attuale
                    </p>
                    <p className="text-3xl font-bold text-slate-900">
                      {formatCurrency(Number(account.balance), account.currency)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">
                      Creato {new Date(account.createdAt).toLocaleDateString('it-IT')}
                    </span>
                    <button className="text-primary-600 hover:text-primary-700 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Modifica →
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
