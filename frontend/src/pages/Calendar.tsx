import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { useDataStore } from '@/store/dataStore';
import { formatCurrency } from '@/utils/format';
import Layout from '@/components/Layout';
import ExpenseModal from '@/components/ExpenseModal';
import type { Expense } from '@/types';

type ViewMode = 'month' | 'week' | 'day';

export default function Calendar() {
  const { expenses, fetchExpenses, fetchCategories, fetchAccounts } = useDataStore();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | undefined>();

  useEffect(() => {
    fetchExpenses();
    fetchCategories();
    fetchAccounts();
  }, []);

  const getExpensesForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return expenses.filter(e => e.date.startsWith(dateStr));
  };

  const getTotalForDate = (date: Date) => {
    const dayExpenses = getExpensesForDate(date);
    const total = dayExpenses.reduce((sum, e) => {
      const amount = Number(e.amount);
      return e.type === 'EXPENSE' ? sum - amount : sum + amount;
    }, 0);
    return total;
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Aggiungi giorni vuoti prima del primo giorno del mese
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Aggiungi tutti i giorni del mese
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
  };

  const monthName = currentDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
  const days = getDaysInMonth(currentDate);
  const weekDays = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

  const selectedDayExpenses = selectedDate ? getExpensesForDate(selectedDate) : [];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Calendario</h2>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Visualizza le tue spese per giorno
            </p>
          </div>

          <button
            onClick={goToToday}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
          >
            <CalendarIcon className="w-5 h-5" />
            <span>Oggi</span>
          </button>
        </div>

        {/* Calendario */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
          {/* Controlli Navigazione */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white capitalize">
              {monthName}
            </h3>

            <div className="flex items-center gap-2">
              <button
                onClick={goToPreviousMonth}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <ChevronLeftIcon className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              </button>
              <button
                onClick={goToNextMonth}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <ChevronRightIcon className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              </button>
            </div>
          </div>

          {/* Griglia Calendario */}
          <div className="grid grid-cols-7 gap-2">
            {/* Intestazioni giorni settimana */}
            {weekDays.map(day => (
              <div
                key={day}
                className="text-center text-sm font-semibold text-slate-600 dark:text-slate-400 py-2"
              >
                {day}
              </div>
            ))}

            {/* Giorni del mese */}
            {days.map((day, index) => {
              if (!day) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }

              const dayExpenses = getExpensesForDate(day);
              const total = getTotalForDate(day);
              const isToday = day.toDateString() === new Date().toDateString();
              const isSelected = selectedDate?.toDateString() === day.toDateString();

              return (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleDayClick(day)}
                  className={`
                    aspect-square p-2 rounded-xl transition-all relative
                    ${isToday ? 'ring-2 ring-primary-500' : ''}
                    ${isSelected ? 'bg-primary-100 dark:bg-primary-900/30' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}
                  `}
                >
                  <div className="text-right">
                    <span className={`
                      text-sm font-medium
                      ${isToday ? 'text-primary-600 dark:text-primary-400 font-bold' : 'text-slate-700 dark:text-slate-300'}
                    `}>
                      {day.getDate()}
                    </span>
                  </div>

                  {dayExpenses.length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {dayExpenses.slice(0, 2).map((expense, idx) => (
                        <div
                          key={idx}
                          className="h-1 rounded-full"
                          style={{ backgroundColor: expense.category.color }}
                        />
                      ))}
                      {dayExpenses.length > 2 && (
                        <div className="text-[10px] text-slate-500 dark:text-slate-500">
                          +{dayExpenses.length - 2}
                        </div>
                      )}
                    </div>
                  )}

                  {total !== 0 && (
                    <div className={`
                      absolute bottom-1 right-1 text-[10px] font-semibold px-1 rounded
                      ${total < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}
                    `}>
                      {total < 0 ? '-' : '+'}{Math.abs(total).toFixed(0)}€
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Spese del giorno selezionato */}
        {selectedDate && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
              Spese del {selectedDate.toLocaleDateString('it-IT', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </h3>

            {selectedDayExpenses.length === 0 ? (
              <p className="text-slate-600 dark:text-slate-400 text-center py-8">
                Nessuna spesa registrata per questo giorno
              </p>
            ) : (
              <div className="space-y-3">
                {selectedDayExpenses.map((expense) => (
                  <motion.div
                    key={expense.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                        style={{ backgroundColor: `${expense.category.color}20` }}
                      >
                        {expense.category.icon}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {expense.description}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-500">
                          {expense.category.name} • {expense.account.name}
                        </p>
                      </div>
                    </div>

                    <p className={`text-lg font-bold ${
                      expense.type === 'EXPENSE'
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-green-600 dark:text-green-400'
                    }`}>
                      {expense.type === 'EXPENSE' ? '-' : '+'}
                      {formatCurrency(Number(expense.amount))}
                    </p>
                  </motion.div>
                ))}

                <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Totale giornata:
                    </span>
                    <span className={`text-xl font-bold ${
                      getTotalForDate(selectedDate) < 0
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-green-600 dark:text-green-400'
                    }`}>
                      {formatCurrency(getTotalForDate(selectedDate))}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Spesa */}
      <ExpenseModal
        isOpen={showExpenseModal}
        onClose={() => {
          setShowExpenseModal(false);
          setSelectedExpense(undefined);
        }}
        expense={selectedExpense}
        onSuccess={() => {
          fetchExpenses();
        }}
      />
    </Layout>
  );
}
