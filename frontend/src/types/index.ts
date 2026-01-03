export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  createdAt: string;
  updatedAt?: string;
}

export type AccountType = 'CHECKING' | 'SAVINGS' | 'CASH' | 'CREDIT_CARD' | 'INVESTMENT' | 'OTHER';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  color?: string;
  icon?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string;
  description?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ExpenseType = 'EXPENSE' | 'INCOME';
export type ExpenseStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

export interface Attachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  type: 'IMAGE' | 'PDF' | 'DOCUMENT' | 'OTHER';
  path: string;
  thumbnail?: string;
  ocrText?: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  amount: number;
  type: ExpenseType;
  description: string;
  notes?: string;
  date: string;
  status: ExpenseStatus;
  isAiGenerated: boolean;
  aiConfidence?: number;
  location?: string;
  latitude?: number;
  longitude?: number;
  createdAt: string;
  updatedAt: string;
  category: Category;
  account: Account;
  attachments?: Attachment[];
}

export interface CreateExpenseDTO {
  amount: number;
  type: ExpenseType;
  description: string;
  notes?: string;
  date?: string;
  accountId: string;
  categoryId: string;
  location?: string;
  latitude?: number;
  longitude?: number;
}

export interface UpdateExpenseDTO {
  amount?: number;
  type?: ExpenseType;
  description?: string;
  notes?: string;
  date?: string;
  accountId?: string;
  categoryId?: string;
  status?: ExpenseStatus;
  location?: string;
  latitude?: number;
  longitude?: number;
}

export interface Stats {
  totalExpenses: number;
  totalIncome: number;
  balance: number;
  count: number;
  byCategory: Record<string, {
    total: number;
    count: number;
    color: string;
  }>;
}

export interface OCRResult {
  amount?: number;
  date?: string;
  merchant?: string;
  category?: string;
  description?: string;
  confidence: number;
  rawText?: string;
}

export interface ExpenseFilters {
  search?: string;
  categoryId?: string;
  accountId?: string;
  type?: ExpenseType;
  status?: ExpenseStatus;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

// Contact types
export interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    loans: number;
  };
}

export interface CreateContactDTO {
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
}

export interface UpdateContactDTO {
  name?: string;
  email?: string;
  phone?: string;
  notes?: string;
}

// Loan types
export type LoanType = 'LENT' | 'BORROWED';
export type LoanStatus = 'ACTIVE' | 'PAID' | 'CANCELLED';

export interface Loan {
  id: string;
  type: LoanType;
  amount: number;
  remainingAmount: number;
  description: string;
  notes?: string;
  loanDate: string;
  dueDate?: string;
  status: LoanStatus;
  createdAt: string;
  updatedAt: string;
  contact: Contact;
}

export interface CreateLoanDTO {
  type: LoanType;
  amount: number;
  description: string;
  notes?: string;
  loanDate?: string;
  dueDate?: string;
  contactId: string;
}

export interface UpdateLoanDTO {
  amount?: number;
  remainingAmount?: number;
  description?: string;
  notes?: string;
  loanDate?: string;
  dueDate?: string;
  status?: LoanStatus;
}

export interface LoanSummary {
  totalLent: number;
  totalBorrowed: number;
  netBalance: number;
  activeLentCount: number;
  activeBorrowedCount: number;
}
