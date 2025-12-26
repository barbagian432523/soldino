import axios from 'axios';
import type {
  User,
  Account,
  Category,
  Expense,
  CreateExpenseDTO,
  UpdateExpenseDTO,
  Stats,
  ExpenseFilters,
} from '@/types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor per aggiungere il token JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor per gestire errori di autenticazione
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ========== AUTH ==========
export const authAPI = {
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => api.post<{ user: User; token: string }>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post<{ user: User; token: string }>('/auth/login', data),

  me: () => api.get<{ user: User }>('/auth/me'),
};

// ========== ACCOUNTS ==========
export const accountsAPI = {
  getAll: () => api.get<{ accounts: Account[] }>('/accounts'),

  getStats: () => api.get<{ stats: any; accounts: Account[] }>('/accounts/stats'),

  create: (data: Partial<Account>) =>
    api.post<{ account: Account }>('/accounts', data),

  update: (id: string, data: Partial<Account>) =>
    api.put<{ account: Account }>(`/accounts/${id}`, data),

  delete: (id: string) => api.delete(`/accounts/${id}`),
};

// ========== CATEGORIES ==========
export const categoriesAPI = {
  getAll: () => api.get<{ categories: Category[] }>('/categories'),

  create: (data: Partial<Category>) =>
    api.post<{ category: Category }>('/categories', data),

  update: (id: string, data: Partial<Category>) =>
    api.put<{ category: Category }>(`/categories/${id}`, data),

  delete: (id: string) => api.delete(`/categories/${id}`),
};

// ========== EXPENSES ==========
export const expensesAPI = {
  getAll: (filters?: ExpenseFilters) =>
    api.get<{
      expenses: Expense[];
      pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
      };
    }>('/expenses', { params: filters }),

  getOne: (id: string) => api.get<{ expense: Expense }>(`/expenses/${id}`),

  getStats: (params?: { dateFrom?: string; dateTo?: string; accountId?: string }) =>
    api.get<{ stats: Stats }>('/expenses/stats', { params }),

  create: (data: CreateExpenseDTO) =>
    api.post<{ expense: Expense }>('/expenses', data),

  update: (id: string, data: UpdateExpenseDTO) =>
    api.put<{ expense: Expense }>(`/expenses/${id}`, data),

  delete: (id: string) => api.delete(`/expenses/${id}`),
};

// ========== UPLOAD & OCR ==========
export const uploadAPI = {
  analyzeReceipt: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<{
      ocr: any;
      suggestion: any;
      uploadedFile: any;
    }>('/upload/analyze-receipt', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  createFromReceipt: (data: any) =>
    api.post<{ expense: Expense }>('/upload/create-from-receipt', data),

  uploadAttachment: (expenseId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/expenses/${expenseId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  deleteAttachment: (id: string) => api.delete(`/attachments/${id}`),
};

export default api;
