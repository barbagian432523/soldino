import { create } from 'zustand';
import type { Account, Category, Expense, Stats } from '@/types';
import { accountsAPI, categoriesAPI, expensesAPI } from '@/services/api';

interface DataState {
  // Data
  accounts: Account[];
  categories: Category[];
  expenses: Expense[];
  stats: Stats | null;

  // Loading states
  isLoadingAccounts: boolean;
  isLoadingCategories: boolean;
  isLoadingExpenses: boolean;

  // Actions
  fetchAccounts: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchExpenses: (filters?: any) => Promise<void>;
  fetchStats: (params?: any) => Promise<void>;

  addExpense: (expense: Expense) => void;
  updateExpense: (expense: Expense) => void;
  removeExpense: (id: string) => void;

  addAccount: (account: Account) => void;
  updateAccount: (account: Account) => void;
  removeAccount: (id: string) => void;
}

export const useDataStore = create<DataState>((set) => ({
  accounts: [],
  categories: [],
  expenses: [],
  stats: null,

  isLoadingAccounts: false,
  isLoadingCategories: false,
  isLoadingExpenses: false,

  fetchAccounts: async () => {
    set({ isLoadingAccounts: true });
    try {
      const { data } = await accountsAPI.getAll();
      set({ accounts: data.accounts });
    } finally {
      set({ isLoadingAccounts: false });
    }
  },

  fetchCategories: async () => {
    set({ isLoadingCategories: true });
    try {
      const { data } = await categoriesAPI.getAll();
      set({ categories: data.categories });
    } finally {
      set({ isLoadingCategories: false });
    }
  },

  fetchExpenses: async (filters) => {
    set({ isLoadingExpenses: true });
    try {
      const { data } = await expensesAPI.getAll(filters);
      set({ expenses: data.expenses });
    } finally {
      set({ isLoadingExpenses: false });
    }
  },

  fetchStats: async (params) => {
    try {
      const { data } = await expensesAPI.getStats(params);
      set({ stats: data.stats });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  },

  addExpense: (expense) =>
    set((state) => ({ expenses: [expense, ...state.expenses] })),

  updateExpense: (expense) =>
    set((state) => ({
      expenses: state.expenses.map((e) => (e.id === expense.id ? expense : e)),
    })),

  removeExpense: (id) =>
    set((state) => ({
      expenses: state.expenses.filter((e) => e.id !== id),
    })),

  addAccount: (account) =>
    set((state) => ({ accounts: [...state.accounts, account] })),

  updateAccount: (account) =>
    set((state) => ({
      accounts: state.accounts.map((a) => (a.id === account.id ? account : a)),
    })),

  removeAccount: (id) =>
    set((state) => ({
      accounts: state.accounts.filter((a) => a.id !== id),
    })),
}));
