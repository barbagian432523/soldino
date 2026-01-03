import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  PlusIcon,
  CameraIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@heroicons/react/24/outline';
import { useDataStore } from '@/store/dataStore';
import { formatCurrency, formatDateShort } from '@/utils/format';
import Layout from '@/components/Layout';
import ReceiptScanner from '@/components/ReceiptScanner';
import ExpenseModal from '@/components/ExpenseModal';

export default function Dashboard() {
  const {
    accounts,
    expenses,
    stats,
    fetchAccounts,
    fetchExpenses,
    fetchStats,
    isLoadingExpenses,
  } = useDataStore();

  const [showScanner, setShowScanner] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  useEffect(() => {
    fetchAccounts();
    fetchExpenses({ limit: 10 });
    fetchStats();
  }, []);

  const totalBalance = accounts.reduce(
    (sum, acc) => sum + Number(acc.balance),
    0
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header con pulsanti azione */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Dashboard</h2>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Panoramica delle tue finanze
            </p>
          </div>

          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              onClick={() => setShowScanner(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-2xl soft-shadow-lg hover:soft-shadow glow-primary"
            >
              <CameraIcon className="w-5 h-5" />
              <span>Scansiona Ricevuta</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              onClick={() => setShowExpenseModal(true)}
              className="flex items-center gap-2 px-4 py-2 liquid-gradient text-white rounded-2xl soft-shadow-lg hover:soft-shadow"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Nuova Spesa</span>
            </motion.button>
          </div>
        </div>

        {/* Cards statistiche */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              delay: 0.1,
              type: "spring",
              stiffness: 100,
              damping: 15
            }}
            whileHover={{ scale: 1.02, y: -4 }}
            className="liquid-gradient rounded-3xl p-6 text-white soft-shadow-lg float-animation"
          >
            <p className="text-primary-100 text-sm font-medium mb-1">
              Saldo Totale
            </p>
            <p className="text-4xl font-bold">
              {formatCurrency(totalBalance)}
            </p>
            <p className="text-primary-100 text-xs mt-2">
              {accounts.length} conti attivi
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              delay: 0.2,
              type: "spring",
              stiffness: 100,
              damping: 15
            }}
            whileHover={{ scale: 1.02, y: -4 }}
            className="glass-card dark:glass-card-dark rounded-3xl p-6 soft-shadow-lg glow-danger shimmer"
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Spese</p>
              <ArrowDownIcon className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(stats?.totalExpenses || 0)}
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-2">Questo mese</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              delay: 0.3,
              type: "spring",
              stiffness: 100,
              damping: 15
            }}
            whileHover={{ scale: 1.02, y: -4 }}
            className="glass-card dark:glass-card-dark rounded-3xl p-6 soft-shadow-lg glow-success shimmer"
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Entrate</p>
              <ArrowUpIcon className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(stats?.totalIncome || 0)}
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-2">Questo mese</p>
          </motion.div>
        </div>

        {/* Conti */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, type: "spring", stiffness: 80 }}
          className="glass-card dark:glass-card-dark rounded-3xl p-6 soft-shadow-lg liquid-morph"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">I tuoi conti</h3>
            <Link
              to="/accounts"
              className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium transition-colors"
            >
              Gestisci →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {accounts.slice(0, 4).map((account, idx) => (
              <motion.div
                key={account.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: 0.5 + idx * 0.1,
                  type: "spring",
                  stiffness: 120,
                  damping: 20
                }}
                whileHover={{ scale: 1.03, x: 4 }}
                className="glass-button rounded-2xl p-4 perspective-card"
                style={{ borderLeftColor: account.color, borderLeftWidth: 4 }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{account.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {account.type}
                    </p>
                  </div>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    {formatCurrency(Number(account.balance))}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Ultime spese */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 80 }}
          className="glass-card dark:glass-card-dark rounded-3xl p-6 soft-shadow-lg liquid-morph"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Ultime spese</h3>
            <Link
              to="/expenses"
              className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium transition-colors"
            >
              Vedi tutte →
            </Link>
          </div>

          {isLoadingExpenses ? (
            <div className="text-center py-8 text-slate-500">
              Caricamento...
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              Nessuna spesa registrata
            </div>
          ) : (
            <div className="space-y-3">
              {expenses.map((expense, idx) => (
                <motion.div
                  key={expense.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: 0.6 + idx * 0.05,
                    type: "spring",
                    stiffness: 120
                  }}
                  whileHover={{ scale: 1.02, x: 8 }}
                  className="glass-button flex items-center justify-between p-4 rounded-2xl soft-shadow perspective-card"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                      style={{
                        backgroundColor: `${expense.category.color}20`,
                      }}
                    >
                      {expense.category.icon || '📄'}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {expense.description}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {expense.category.name} •{' '}
                        {formatDateShort(expense.date)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p
                      className={`text-lg font-bold ${
                        expense.type === 'EXPENSE'
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-green-600 dark:text-green-400'
                      }`}
                    >
                      {expense.type === 'EXPENSE' ? '-' : '+'}
                      {formatCurrency(Number(expense.amount))}
                    </p>
                    {expense.isAiGenerated && (
                      <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                        ✨ AI {expense.aiConfidence}%
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Modal Scanner Ricevute */}
      {showScanner && (
        <ReceiptScanner onClose={() => setShowScanner(false)} />
      )}

      {/* Modal Nuova Spesa */}
      <ExpenseModal
        isOpen={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        onSuccess={() => {
          fetchExpenses({ limit: 10 });
          fetchStats();
          fetchAccounts();
        }}
      />
    </Layout>
  );
}
