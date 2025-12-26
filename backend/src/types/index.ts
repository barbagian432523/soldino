import { Request } from 'express';

export interface AuthRequest extends Request {
  userId?: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
}

export interface RegisterDTO {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface CreateExpenseDTO {
  amount: number;
  type: 'EXPENSE' | 'INCOME';
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
  type?: 'EXPENSE' | 'INCOME';
  description?: string;
  notes?: string;
  date?: string;
  accountId?: string;
  categoryId?: string;
  status?: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  location?: string;
  latitude?: number;
  longitude?: number;
}

export interface CreateAccountDTO {
  name: string;
  type: 'CHECKING' | 'SAVINGS' | 'CASH' | 'CREDIT_CARD' | 'INVESTMENT' | 'OTHER';
  balance?: number;
  currency?: string;
  color?: string;
  icon?: string;
  description?: string;
}

export interface CreateCategoryDTO {
  name: string;
  color?: string;
  icon?: string;
  description?: string;
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
