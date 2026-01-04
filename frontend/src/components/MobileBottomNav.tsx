import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HomeIcon,
  CreditCardIcon,
  PlusIcon,
  ChartBarIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  CreditCardIcon as CreditCardIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  CalendarIcon as CalendarIconSolid,
} from '@heroicons/react/24/solid';

interface MobileBottomNavProps {
  onAddExpense: () => void;
}

export default function MobileBottomNav({ onAddExpense }: MobileBottomNavProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    {
      path: '/',
      label: 'Home',
      icon: HomeIcon,
      iconSolid: HomeIconSolid,
    },
    {
      path: '/expenses',
      label: 'Spese',
      icon: CreditCardIcon,
      iconSolid: CreditCardIconSolid,
    },
    {
      path: null, // Placeholder for center button
      label: '',
      icon: null,
      iconSolid: null,
    },
    {
      path: '/statistics',
      label: 'Stats',
      icon: ChartBarIcon,
      iconSolid: ChartBarIconSolid,
    },
    {
      path: '/calendar',
      label: 'Agenda',
      icon: CalendarIcon,
      iconSolid: CalendarIconSolid,
    },
  ];

  const isActive = (path: string | null) => {
    if (!path) return false;
    return location.pathname === path;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      {/* Backdrop blur */}
      <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200 dark:border-slate-700" />

      {/* Navigation */}
      <nav className="relative max-w-screen-sm mx-auto px-4 pb-2">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item, index) => {
            // Center button (Add Expense)
            if (item.path === null) {
              return (
                <motion.button
                  key="add-button"
                  whileTap={{ scale: 0.9 }}
                  onClick={onAddExpense}
                  className="relative -top-4"
                >
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 shadow-2xl flex items-center justify-center ring-4 ring-white dark:ring-slate-900">
                    <PlusIcon className="w-8 h-8 text-white" strokeWidth={3} />
                  </div>
                  {/* Glow effect */}
                  <div className="absolute inset-0 w-16 h-16 rounded-full bg-primary-400 blur-xl opacity-50 -z-10" />
                </motion.button>
              );
            }

            const Icon = isActive(item.path) ? item.iconSolid : item.icon;
            const active = isActive(item.path);

            return (
              <motion.button
                key={item.path}
                whileTap={{ scale: 0.9 }}
                onClick={() => item.path && navigate(item.path)}
                className="flex flex-col items-center justify-center gap-1 min-w-[60px]"
              >
                <div
                  className={`transition-all ${
                    active
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {Icon && <Icon className="w-6 h-6" />}
                </div>
                <span
                  className={`text-[10px] font-medium transition-all ${
                    active
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {item.label}
                </span>
                {active && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary-600 dark:bg-primary-400"
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
