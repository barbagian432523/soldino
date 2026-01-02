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
            <h2 className="text-3xl font-bold text-slate-900">Dashboard</h2>
            <p className="text-slate-600 mt-1">
              Panoramica delle tue finanze
            </p>
          </div>

          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowScanner(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              <CameraIcon className="w-5 h-5" />
              <span>Scansiona Ricevuta</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowExpenseModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Nuova Spesa</span>
            </motion.button>
          </div>
        </div>

        {/* Cards statistiche */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-6 text-white shadow-xl"
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-slate-600 text-sm font-medium">Spese</p>
              <ArrowDownIcon className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-3xl font-bold text-slate-900">
              {formatCurrency(stats?.totalExpenses || 0)}
            </p>
            <p className="text-slate-500 text-xs mt-2">Questo mese</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-slate-600 text-sm font-medium">Entrate</p>
              <ArrowUpIcon className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-slate-900">
              {formatCurrency(stats?.totalIncome || 0)}
            </p>
            <p className="text-slate-500 text-xs mt-2">Questo mese</p>
          </motion.div>
        </div>

        {/* Conti */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-slate-900">I tuoi conti</h3>
            <Link
              to="/accounts"
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              Gestisci →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {accounts.slice(0, 4).map((account) => (
              <motion.div
                key={account.id}
                whileHover={{ scale: 1.02 }}
                className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition-all"
                style={{ borderLeftColor: account.color, borderLeftWidth: 4 }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-slate-900">{account.name}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {account.type}
                    </p>
                  </div>
                  <p className="text-lg font-bold text-slate-900">
                    {formatCurrency(Number(account.balance))}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Ultime spese */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-slate-900">Ultime spese</h3>
            <Link
              to="/expenses"
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
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
              {expenses.map((expense) => (
                <motion.div
                  key={expense.id}
                  whileHover={{ x: 5 }}
                  className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:shadow-md transition-all"
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
                      <p className="font-medium text-slate-900">
                        {expense.description}
                      </p>
                      <p className="text-sm text-slate-500">
                        {expense.category.name} •{' '}
                        {formatDateShort(expense.date)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p
                      className={`text-lg font-bold ${
                        expense.type === 'EXPENSE'
                          ? 'text-red-600'
                          : 'text-green-600'
                      }`}
                    >
                      {expense.type === 'EXPENSE' ? '-' : '+'}
                      {formatCurrency(Number(expense.amount))}
                    </p>
                    {expense.isAiGenerated && (
                      <p className="text-xs text-purple-600 mt-1">
                        ✨ AI {expense.aiConfidence}%
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
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
