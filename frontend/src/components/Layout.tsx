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
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats/dashboard', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Errore recupero statistiche:', error);
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

              {/* Stats - Always visible */}
              {stats && (
                <div className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 bg-gradient-to-r from-primary-50 to-blue-50 dark:from-slate-700 dark:to-slate-600 rounded-xl border border-primary-100 dark:border-slate-600 shadow-sm">
                  <div className="text-center">
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">💰</p>
                    <p className="text-xs md:text-sm font-bold text-primary-700 dark:text-primary-300">
                      {stats.totalExpenses}
                    </p>
                  </div>
                  <div className="w-px h-6 md:h-8 bg-primary-200 dark:bg-slate-500" />
                  <div className="text-center">
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">📊</p>
                    <p className="text-xs md:text-sm font-bold text-blue-700 dark:text-blue-300">
                      {stats.totalOperations}
                    </p>
                  </div>
                  <div className="w-px h-6 md:h-8 bg-primary-200 dark:bg-slate-500" />
                  <div className="text-center">
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">💾</p>
                    <p className="text-xs md:text-sm font-bold text-green-700 dark:text-green-300">
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation */}
          <nav className="lg:w-64 flex-shrink-0">
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
    </div>
  );
}
