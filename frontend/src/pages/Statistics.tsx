import { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useDataStore } from '@/store/dataStore';
import { formatCurrency } from '@/utils/format';
import Layout from '@/components/Layout';

export default function Statistics() {
  const { stats, fetchStats } = useDataStore();

  useEffect(() => {
    fetchStats();
  }, []);

  // Prepara dati per grafici
  const categoryData = stats?.byCategory
    ? Object.entries(stats.byCategory).map(([name, data]) => ({
        name,
        value: data.total,
        color: data.color,
        count: data.count,
      }))
    : [];

  const sortedCategories = [...categoryData].sort((a, b) => b.value - a.value);
  const topCategories = sortedCategories.slice(0, 5);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Statistiche</h2>
          <p className="text-slate-600 mt-1">Analizza le tue abitudini di spesa</p>
        </div>

        {/* Cards riepilogo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-xl"
          >
            <p className="text-red-100 text-sm mb-1">Totale Spese</p>
            <p className="text-3xl font-bold">
              {formatCurrency(stats?.totalExpenses || 0)}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-xl"
          >
            <p className="text-green-100 text-sm mb-1">Totale Entrate</p>
            <p className="text-3xl font-bold">
              {formatCurrency(stats?.totalIncome || 0)}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-6 text-white shadow-xl"
          >
            <p className="text-primary-100 text-sm mb-1">Bilancio</p>
            <p className="text-3xl font-bold">
              {formatCurrency(stats?.balance || 0)}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl"
          >
            <p className="text-purple-100 text-sm mb-1">Transazioni</p>
            <p className="text-3xl font-bold">{stats?.count || 0}</p>
          </motion.div>
        </div>

        {/* Grafici */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Grafico a torta - Spese per categoria */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <h3 className="text-xl font-bold text-slate-900 mb-4">
              Spese per Categoria
            </h3>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) => `${entry.name} (${formatCurrency(entry.value)})`}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-slate-500">
                Nessun dato disponibile
              </div>
            )}
          </motion.div>

          {/* Top 5 categorie */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <h3 className="text-xl font-bold text-slate-900 mb-4">
              Top 5 Categorie
            </h3>
            {topCategories.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topCategories}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {topCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-slate-500">
                Nessun dato disponibile
              </div>
            )}
          </motion.div>
        </div>

        {/* Tabella dettagliata */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          <h3 className="text-xl font-bold text-slate-900 mb-4">
            Dettaglio Categorie
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                    Categoria
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">
                    Transazioni
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">
                    Totale
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">
                    Media
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedCategories.map((cat, index) => (
                  <motion.tr
                    key={cat.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="font-medium text-slate-900">
                          {cat.name}
                        </span>
                      </div>
                    </td>
                    <td className="text-right py-3 px-4 text-slate-700">
                      {cat.count}
                    </td>
                    <td className="text-right py-3 px-4 font-semibold text-slate-900">
                      {formatCurrency(cat.value)}
                    </td>
                    <td className="text-right py-3 px-4 text-slate-700">
                      {formatCurrency(cat.value / cat.count)}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
