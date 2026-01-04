import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ClockIcon,
  DocumentTextIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  PencilIcon,
  PlusCircleIcon,
  ArrowRightOnRectangleIcon,
  ArrowLeftOnRectangleIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import Layout from '@/components/Layout';

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId?: string;
  description: string;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

const actionIcons: Record<string, any> = {
  CREATE: PlusCircleIcon,
  UPDATE: PencilIcon,
  DELETE: TrashIcon,
  LOGIN: ArrowRightOnRectangleIcon,
  LOGOUT: ArrowLeftOnRectangleIcon,
  UPLOAD: ArrowUpTrayIcon,
  DOWNLOAD: ArrowDownTrayIcon,
  EXPORT: ArrowDownTrayIcon,
  IMPORT: ArrowUpTrayIcon,
};

const actionColors: Record<string, string> = {
  CREATE: 'text-green-600 bg-green-100 dark:bg-green-900/20',
  UPDATE: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20',
  DELETE: 'text-red-600 bg-red-100 dark:bg-red-900/20',
  LOGIN: 'text-purple-600 bg-purple-100 dark:bg-purple-900/20',
  LOGOUT: 'text-gray-600 bg-gray-100 dark:bg-gray-900/20',
  UPLOAD: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/20',
  DOWNLOAD: 'text-cyan-600 bg-cyan-100 dark:bg-cyan-900/20',
  EXPORT: 'text-orange-600 bg-orange-100 dark:bg-orange-900/20',
  IMPORT: 'text-teal-600 bg-teal-100 dark:bg-teal-900/20',
};

const actionLabels: Record<string, string> = {
  CREATE: 'Creazione',
  UPDATE: 'Modifica',
  DELETE: 'Eliminazione',
  LOGIN: 'Login',
  LOGOUT: 'Logout',
  UPLOAD: 'Upload',
  DOWNLOAD: 'Download',
  EXPORT: 'Esportazione',
  IMPORT: 'Importazione',
};

export default function AuditLog() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState({
    action: '',
    entity: '',
    startDate: '',
    endDate: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.action) params.append('action', filter.action);
      if (filter.entity) params.append('entity', filter.entity);
      if (filter.startDate) params.append('startDate', filter.startDate);
      if (filter.endDate) params.append('endDate', filter.endDate);

      const response = await fetch(
        `/api/audit-logs?${params}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs);
        setTotal(data.total);
      }
    } catch (error) {
      console.error('Errore recupero log:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
            📋 Registro Eventi
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Storico completo di tutte le operazioni ({total} eventi)
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 liquid-gradient text-white rounded-2xl soft-shadow-lg hover:soft-shadow"
        >
          <FunnelIcon className="w-5 h-5" />
          Filtri
        </motion.button>
      </div>

      {/* Filtri */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white dark:bg-slate-800 rounded-3xl p-6 soft-shadow-lg border-2 border-slate-200 dark:border-slate-700"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Azione
              </label>
              <select
                value={filter.action}
                onChange={(e) => setFilter({ ...filter, action: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Tutte</option>
                {Object.keys(actionLabels).map((action) => (
                  <option key={action} value={action}>
                    {actionLabels[action]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Entità
              </label>
              <input
                type="text"
                value={filter.entity}
                onChange={(e) => setFilter({ ...filter, entity: e.target.value })}
                placeholder="Es: Expense, Account..."
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Da
              </label>
              <input
                type="date"
                value={filter.startDate}
                onChange={(e) => setFilter({ ...filter, startDate: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                A
              </label>
              <input
                type="date"
                value={filter.endDate}
                onChange={(e) => setFilter({ ...filter, endDate: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Log List */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl soft-shadow-lg border-2 border-slate-200 dark:border-slate-700">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-400">Caricamento log...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="w-16 h-16 mx-auto text-slate-400 dark:text-slate-600" />
            <p className="mt-4 text-lg font-medium text-slate-900 dark:text-white">
              Nessun evento registrato
            </p>
            <p className="text-slate-600 dark:text-slate-400">
              I tuoi eventi appariranno qui
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {logs.map((log) => {
              const Icon = actionIcons[log.action] || DocumentTextIcon;
              const colorClass = actionColors[log.action] || 'text-gray-600 bg-gray-100';

              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all"
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`p-3 rounded-xl ${colorClass}`}>
                      <Icon className="w-6 h-6" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                            {actionLabels[log.action] || log.action} • {log.entity}
                          </h3>
                          <p className="text-slate-600 dark:text-slate-400 mt-1">
                            {log.description}
                          </p>

                          {/* Metadata */}
                          {log.metadata && Object.keys(log.metadata).length > 0 && (
                            <details className="mt-2">
                              <summary className="text-sm text-primary-600 dark:text-primary-400 cursor-pointer">
                                Dettagli
                              </summary>
                              <pre className="mt-2 text-xs bg-slate-100 dark:bg-slate-800 p-3 rounded-lg overflow-x-auto">
                                {JSON.stringify(log.metadata, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>

                        <div className="text-right flex-shrink-0">
                          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                            <ClockIcon className="w-4 h-4" />
                            {format(new Date(log.createdAt), "dd MMM yyyy 'alle' HH:mm", {
                              locale: it,
                            })}
                          </div>
                          {log.ipAddress && (
                            <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                              IP: {log.ipAddress}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
      </div>
    </Layout>
  );
}
