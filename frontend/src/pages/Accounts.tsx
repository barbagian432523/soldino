import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { PlusIcon, PencilIcon, TrashIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline';
import { useDataStore } from '@/store/dataStore';
import { formatCurrency, getAccountTypeLabel } from '@/utils/format';
import { accountsAPI } from '@/services/api';
import Layout from '@/components/Layout';
import AccountModal from '@/components/AccountModal';
import TransferModal from '@/components/TransferModal';
import type { Account } from '@/types';

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
  const [showModal, setShowModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | undefined>();

  useEffect(() => {
    fetchAccounts();
  }, []);

  const totalBalance = accounts.reduce(
    (sum, acc) => sum + Number(acc.balance),
    0
  );

  const handleEdit = (account: Account) => {
    setSelectedAccount(account);
    setShowModal(true);
  };

  const handleDelete = async (account: Account) => {
    if (!confirm(`Eliminare il conto "${account.name}"?`)) return;

    try {
      await accountsAPI.delete(account.id);
      await fetchAccounts();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Errore durante l\'eliminazione');
    }
  };

  const handleNewAccount = () => {
    setSelectedAccount(undefined);
    setShowModal(true);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
              💳 Conti
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Gestisci i tuoi conti e portafogli
            </p>
          </div>

          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              onClick={() => setShowTransferModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl soft-shadow-lg hover:soft-shadow"
            >
              <ArrowsRightLeftIcon className="w-5 h-5" />
              <span>Giroconto</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              onClick={handleNewAccount}
              className="flex items-center gap-2 px-4 py-2 liquid-gradient text-white rounded-2xl soft-shadow-lg hover:soft-shadow"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Nuovo Conto</span>
            </motion.button>
          </div>
        </div>

        {/* Saldo totale */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 100, damping: 15 }}
          className="liquid-gradient rounded-3xl p-8 text-white soft-shadow-lg float-animation"
        >
          <p className="text-white/80 text-sm font-medium mb-2">
            💰 Saldo Totale
          </p>
          <p className="text-5xl font-bold mb-4">
            {formatCurrency(totalBalance)}
          </p>
          <div className="flex items-center gap-6 text-sm">
            <div>
              <p className="text-white/80">🏦 Conti attivi</p>
              <p className="font-semibold text-lg">{accounts.length}</p>
            </div>
            <div className="h-8 w-px bg-white/30" />
            <div>
              <p className="text-white/80">💵 Portafogli contanti</p>
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
            <p className="text-slate-600 dark:text-slate-400">⏳ Caricamento conti...</p>
          </div>
        ) : accounts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-800 rounded-3xl soft-shadow-lg p-12 text-center border-2 border-slate-200 dark:border-slate-700"
          >
            <div className="text-6xl mb-4">💳</div>
            <p className="text-slate-600 dark:text-slate-400 mb-4 text-lg font-medium">
              Nessun conto configurato
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-500 mb-6">
              Crea il tuo primo conto per iniziare a tracciare le spese
            </p>
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNewAccount}
              className="px-6 py-3 liquid-gradient text-white rounded-2xl font-medium soft-shadow-lg"
            >
              ➕ Crea il primo conto
            </motion.button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accounts.map((account, index) => (
              <motion.div
                key={account.id}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  delay: index * 0.05,
                  type: "spring",
                  stiffness: 120,
                  damping: 20
                }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="bg-white dark:bg-slate-800 rounded-3xl soft-shadow-lg overflow-hidden group border-2 border-slate-200 dark:border-slate-700"
              >
                {/* Header colorato */}
                <div
                  className="p-6 text-white relative overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${
                      account.color || '#3B82F6'
                    }, ${account.color || '#3B82F6'}DD)`,
                  }}
                >
                  <div className="absolute inset-0 shimmer" />
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="text-4xl drop-shadow-lg">
                        {account.icon || accountTypeIcons[account.type] || '💼'}
                      </div>
                      <span className="px-3 py-1 bg-white/30 backdrop-blur-sm text-xs font-semibold rounded-xl shadow-md border border-white/40">
                        {getAccountTypeLabel(account.type)}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold mb-1 drop-shadow">{account.name}</h3>
                    {account.description && (
                      <p className="text-sm opacity-90">{account.description}</p>
                    )}
                  </div>
                </div>

                {/* Body */}
                <div className="p-6">
                  <div className="mb-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                      💰 Saldo attuale
                    </p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">
                      {formatCurrency(Number(account.balance), account.currency)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-sm border-t border-slate-200 dark:border-slate-700 pt-4">
                    <span className="text-slate-500 dark:text-slate-400 text-xs">
                      📅 {new Date(account.createdAt).toLocaleDateString('it-IT')}
                    </span>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(account)}
                        className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-all"
                        title="Modifica"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(account)}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                        title="Elimina"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <AccountModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedAccount(undefined);
        }}
        account={selectedAccount}
        onSuccess={fetchAccounts}
      />

      {/* Transfer Modal */}
      <TransferModal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        onSuccess={() => {
          fetchAccounts();
          setShowTransferModal(false);
        }}
      />
    </Layout>
  );
}
