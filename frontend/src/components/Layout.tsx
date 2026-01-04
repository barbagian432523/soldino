import { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HomeIcon,
  CreditCardIcon,
  DocumentTextIcon,
  TagIcon,
  CalendarIcon,
  BanknotesIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  MoonIcon,
  SunIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import MobileBottomNav from './MobileBottomNav';
import ExpenseModal from './ExpenseModal';
import { useDataStore } from '@/store/dataStore';

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: '/', label: 'Dashboard', icon: HomeIcon },
  { path: '/accounts', label: 'Conti', icon: CreditCardIcon },
  { path: '/expenses', label: 'Spese', icon: DocumentTextIcon },
  { path: '/categories', label: 'Categorie', icon: TagIcon },
  { path: '/calendar', label: 'Calendario', icon: CalendarIcon },
  { path: '/loans', label: 'Prestiti', icon: BanknotesIcon },
  { path: '/statistics', label: 'Statistiche', icon: ChartBarIcon },
  { path: '/audit-log', label: 'Registro Eventi', icon: ClipboardDocumentListIcon },
  { path: '/settings', label: 'Impostazioni', icon: Cog6ToothIcon },
];

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { isDark, toggle: toggleDark } = useThemeStore();
  const { fetchExpenses, fetchStats: fetchStoreStats, fetchAccounts } = useDataStore();
  const [stats, setStats] = useState<any>(null);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      console.log('🔍 Fetching stats from /api/stats/dashboard...');
      const response = await fetch('/api/stats/dashboard', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      console.log('📊 Stats response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Stats data:', data);
        setStats(data);
      } else {
        const errorText = await response.text();
        console.error('❌ Stats API error:', response.status, errorText);
        // Set default values if API fails
        setStats({
          totalExpenses: 0,
          totalOperations: 0,
          dbSize: 0,
          dbSizeFormatted: '0 B',
        });
      }
    } catch (error) {
      console.error('💥 Errore recupero statistiche:', error);
      // Set default values on error
      setStats({
        totalExpenses: 0,
        totalOperations: 0,
        dbSize: 0,
        dbSizeFormatted: '0 B',
      });
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-24">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="w-20 h-20 rounded-xl flex items-center justify-center shadow-lg overflow-hidden bg-white dark:bg-slate-700 p-1.5">
                  <img
                    src="/logoLMM.PNG"
                    alt="Lighthouse Money Manager"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      // Fallback to emoji if image not found
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.innerHTML = '🏛️';
                      e.currentTarget.parentElement!.classList.add('bg-gradient-to-br', 'from-primary-500', 'to-primary-700', 'text-white', 'font-bold', 'text-3xl');
                    }}
                  />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent leading-tight">
                    Lighthouse Money Manager
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Gestione Finanze Personali</p>
                </div>
              </div>

              {/* Stats - Stile pulito senza sfondo */}
              {stats && (
                <div className="flex items-center gap-3 sm:gap-4 md:gap-6">
                  <div className="text-center">
                    <p className="text-[9px] sm:text-[10px] md:text-xs text-slate-500 dark:text-slate-400 font-medium mb-0.5">💰 Spese</p>
                    <p className="text-sm sm:text-base md:text-lg font-bold text-slate-900 dark:text-white">
                      {stats.totalExpenses}
                    </p>
                  </div>
                  <div className="w-px h-8 sm:h-10 md:h-12 bg-slate-300 dark:bg-slate-600" />
                  <div className="text-center">
                    <p className="text-[9px] sm:text-[10px] md:text-xs text-slate-500 dark:text-slate-400 font-medium mb-0.5">📊 Ops</p>
                    <p className="text-sm sm:text-base md:text-lg font-bold text-slate-900 dark:text-white">
                      {stats.totalOperations}
                    </p>
                  </div>
                  <div className="w-px h-8 sm:h-10 md:h-12 bg-slate-300 dark:bg-slate-600" />
                  <div className="text-center">
                    <p className="text-[9px] sm:text-[10px] md:text-xs text-slate-500 dark:text-slate-400 font-medium mb-0.5">💾 DB</p>
                    <p className="text-sm sm:text-base md:text-lg font-bold text-slate-900 dark:text-white">
                      {stats.dbSizeFormatted}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <div className="text-right hidden sm:block mr-2">
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
              </div>

              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDark}
                className="p-2 text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                title={isDark ? 'Modalità chiara' : 'Modalità scura'}
              >
                {isDark ? (
                  <SunIcon className="w-6 h-6" />
                ) : (
                  <MoonIcon className="w-6 h-6" />
                )}
              </button>

              <button
                onClick={handleLogout}
                className="p-2 text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                title="Logout"
              >
                <ArrowRightOnRectangleIcon className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 lg:pb-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation - Hidden on mobile */}
          <nav className="hidden lg:block lg:w-64 flex-shrink-0">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-4 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`
                      flex items-center space-x-3 px-4 py-3 rounded-xl transition-all
                      ${
                        isActive
                          ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-200 dark:shadow-primary-900/50'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav onAddExpense={() => setShowExpenseModal(true)} />

      {/* Expense Modal */}
      <ExpenseModal
        isOpen={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        onSuccess={() => {
          setShowExpenseModal(false);
          fetchExpenses({ limit: 10 });
          fetchStoreStats();
          fetchAccounts();
          fetchStats();
        }}
      />
    </div>
  );
}
