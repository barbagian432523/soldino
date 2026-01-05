import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest, CreateExpenseDTO, UpdateExpenseDTO } from '../types';
import { Prisma } from '@prisma/client';
import { createAuditLog } from '../services/auditLog';

export class ExpenseController {
  /**
   * Ottieni tutte le spese dell'utente con filtri e ricerca
   */
  static async getAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      const {
        search,
        categoryId,
        accountId,
        type,
        status,
        dateFrom,
        dateTo,
        page = '1',
        limit = '50',
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      // Costruisci filtri
      const where: Prisma.ExpenseWhereInput = {
        userId: req.userId,
      };

      if (search) {
        where.OR = [
          { description: { contains: search as string, mode: 'insensitive' } },
          { notes: { contains: search as string, mode: 'insensitive' } },
          { location: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      if (categoryId) where.categoryId = categoryId as string;
      if (accountId) where.accountId = accountId as string;
      if (type) where.type = type as 'EXPENSE' | 'INCOME';
      if (status) where.status = status as any;

      if (dateFrom || dateTo) {
        where.date = {};
        if (dateFrom) where.date.gte = new Date(dateFrom as string);
        if (dateTo) where.date.lte = new Date(dateTo as string);
      }

      // Query
      const [expenses, total] = await Promise.all([
        prisma.expense.findMany({
          where,
          include: {
            category: true,
            account: true,
            attachments: {
              select: {
                id: true,
                filename: true,
                originalName: true,
                type: true,
                thumbnail: true,
              },
            },
          },
          orderBy: { date: 'desc' },
          skip,
          take: limitNum,
        }),
        prisma.expense.count({ where }),
      ]);

      res.json({
        expenses,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      console.error('Errore recupero spese:', error);
      res.status(500).json({ error: 'Errore durante il recupero delle spese' });
    }
  }

  /**
   * Ottieni una singola spesa
   */
  static async getOne(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const expense = await prisma.expense.findFirst({
        where: { id, userId: req.userId },
        include: {
          category: true,
          account: true,
          attachments: true,
        },
      });

      if (!expense) {
        res.status(404).json({ error: 'Spesa non trovata' });
        return;
      }

      res.json({ expense });
    } catch (error) {
      console.error('Errore recupero spesa:', error);
      res.status(500).json({ error: 'Errore durante il recupero della spesa' });
    }
  }

  /**
   * Crea una nuova spesa
   */
  static async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data: CreateExpenseDTO = req.body;

      // Validazione amount > 0
      if (data.amount <= 0) {
        res.status(400).json({ error: 'L\'importo deve essere maggiore di zero' });
        return;
      }

      // Verifica che account e category appartengano all'utente
      const [account, category] = await Promise.all([
        prisma.account.findFirst({
          where: { id: data.accountId, userId: req.userId },
        }),
        prisma.category.findFirst({
          where: {
            id: data.categoryId,
            OR: [{ userId: req.userId }, { isDefault: true }],
          },
        }),
      ]);

      if (!account) {
        res.status(404).json({ error: 'Account non trovato' });
        return;
      }

      if (!category) {
        res.status(404).json({ error: 'Categoria non trovata' });
        return;
      }

      // Calcola il cambio di balance
      const balanceChange = data.type === 'EXPENSE' ? -data.amount : data.amount;

      // Operazione atomica: crea spesa e aggiorna balance in una transazione
      const expense = await prisma.$transaction(async (tx) => {
        // Crea spesa
        const newExpense = await tx.expense.create({
          data: {
            amount: data.amount,
            type: data.type,
            description: data.description,
            notes: data.notes,
            date: data.date ? new Date(data.date) : new Date(),
            location: data.location,
            latitude: data.latitude,
            longitude: data.longitude,
            userId: req.userId!,
            accountId: data.accountId,
            categoryId: data.categoryId,
            // Recurring fields
            isRecurring: (data as any).isRecurring || false,
            recurringFrequency: (data as any).recurringFrequency || null,
            recurringStartDate: (data as any).recurringStartDate ? new Date((data as any).recurringStartDate) : null,
            recurringEndDate: (data as any).recurringEndDate ? new Date((data as any).recurringEndDate) : null,
          },
          include: {
            category: true,
            account: true,
          },
        });

        // Aggiorna balance account
        await tx.account.update({
          where: { id: data.accountId },
          data: {
            balance: {
              increment: balanceChange,
            },
          },
        });

        return newExpense;
      });

      // Audit log
      await createAuditLog({
        userId: req.userId!,
        action: 'CREATE',
        entity: 'Expense',
        entityId: expense.id,
        description: `Creata ${data.type === 'EXPENSE' ? 'spesa' : 'entrata'}: ${data.description}`,
        metadata: { amount: data.amount, type: data.type, category: category.name },
        req,
      });

      res.status(201).json({
        message: 'Spesa creata con successo',
        expense,
      });
    } catch (error) {
      console.error('Errore creazione spesa:', error);
      res.status(500).json({ error: 'Errore durante la creazione della spesa' });
    }
  }

  /**
   * Aggiorna una spesa
   */
  static async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data: UpdateExpenseDTO = req.body;

      // Validazione amount se fornito
      if (data.amount !== undefined && data.amount <= 0) {
        res.status(400).json({ error: 'L\'importo deve essere maggiore di zero' });
        return;
      }

      // Verifica proprietà
      const existing = await prisma.expense.findFirst({
        where: { id, userId: req.userId },
      });

      if (!existing) {
        res.status(404).json({ error: 'Spesa non trovata' });
        return;
      }

      // Operazione atomica: aggiorna spesa e balance in una transazione
      const expense = await prisma.$transaction(async (tx) => {
        // Calcola cambi di balance
        const oldAmount = Number(existing.amount);
        const newAmount = data.amount !== undefined ? data.amount : oldAmount;
        const oldType = existing.type;
        const newType = data.type || oldType;
        const oldAccountId = existing.accountId;
        const newAccountId = data.accountId || oldAccountId;

        const oldChange = oldType === 'EXPENSE' ? -oldAmount : oldAmount;
        const newChange = newType === 'EXPENSE' ? -newAmount : newAmount;

        // Se cambia l'account, sposta il balance
        if (newAccountId !== oldAccountId) {
          // Ripristina balance sul vecchio account
          await tx.account.update({
            where: { id: oldAccountId },
            data: {
              balance: {
                increment: -oldChange,
              },
            },
          });

          // Applica nuovo balance sul nuovo account
          await tx.account.update({
            where: { id: newAccountId },
            data: {
              balance: {
                increment: newChange,
              },
            },
          });
        } else {
          // Stesso account: applica solo la differenza
          const balanceDiff = newChange - oldChange;
          if (balanceDiff !== 0) {
            await tx.account.update({
              where: { id: oldAccountId },
              data: {
                balance: {
                  increment: balanceDiff,
                },
              },
            });
          }
        }

        // Aggiorna la spesa
        return await tx.expense.update({
          where: { id },
          data: {
            ...data,
            date: data.date ? new Date(data.date) : undefined,
          },
          include: {
            category: true,
            account: true,
            attachments: true,
          },
        });
      });

      // Audit log
      await createAuditLog({
        userId: req.userId!,
        action: 'UPDATE',
        entity: 'Expense',
        entityId: id,
        description: `Aggiornata ${expense.type === 'EXPENSE' ? 'spesa' : 'entrata'}: ${expense.description}`,
        metadata: { changes: data },
        req,
      });

      res.json({
        message: 'Spesa aggiornata con successo',
        expense,
      });
    } catch (error) {
      console.error('Errore aggiornamento spesa:', error);
      res.status(500).json({ error: 'Errore durante l\'aggiornamento della spesa' });
    }
  }

  /**
   * Elimina una spesa
   */
  static async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const existing = await prisma.expense.findFirst({
        where: { id, userId: req.userId },
      });

      if (!existing) {
        res.status(404).json({ error: 'Spesa non trovata' });
        return;
      }

      // Calcola il cambio di balance per ripristinare
      const balanceChange = existing.type === 'EXPENSE'
        ? Number(existing.amount)
        : -Number(existing.amount);

      // Operazione atomica: elimina spesa e ripristina balance in una transazione
      await prisma.$transaction(async (tx) => {
        // Ripristina balance
        await tx.account.update({
          where: { id: existing.accountId },
          data: {
            balance: {
              increment: balanceChange,
            },
          },
        });

        // Elimina la spesa
        await tx.expense.delete({ where: { id } });
      });

      // Audit log
      await createAuditLog({
        userId: req.userId!,
        action: 'DELETE',
        entity: 'Expense',
        entityId: id,
        description: `Eliminata ${existing.type === 'EXPENSE' ? 'spesa' : 'entrata'}: ${existing.description}`,
        metadata: { amount: Number(existing.amount), type: existing.type },
        req,
      });

      res.json({ message: 'Spesa eliminata con successo' });
    } catch (error) {
      console.error('Errore eliminazione spesa:', error);
      res.status(500).json({ error: 'Errore durante l\'eliminazione della spesa' });
    }
  }

  /**
   * Ottieni statistiche spese
   */
  static async getStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { dateFrom, dateTo, accountId } = req.query;

      const where: Prisma.ExpenseWhereInput = {
        userId: req.userId,
      };

      if (accountId) where.accountId = accountId as string;

      if (dateFrom || dateTo) {
        where.date = {};
        if (dateFrom) where.date.gte = new Date(dateFrom as string);
        if (dateTo) where.date.lte = new Date(dateTo as string);
      }

      const expenses = await prisma.expense.findMany({
        where,
        include: { category: true },
      });

      const totalExpenses = expenses
        .filter(e => e.type === 'EXPENSE')
        .reduce((sum, e) => sum + Number(e.amount), 0);

      const totalIncome = expenses
        .filter(e => e.type === 'INCOME')
        .reduce((sum, e) => sum + Number(e.amount), 0);

      const byCategory = expenses.reduce((acc, expense) => {
        const catName = expense.category.name;
        if (!acc[catName]) {
          acc[catName] = {
            total: 0,
            count: 0,
            color: expense.category.color,
          };
        }
        acc[catName].total += Number(expense.amount);
        acc[catName].count += 1;
        return acc;
      }, {} as Record<string, any>);

      res.json({
        stats: {
          totalExpenses,
          totalIncome,
          balance: totalIncome - totalExpenses,
          count: expenses.length,
          byCategory,
        },
      });
    } catch (error) {
      console.error('Errore recupero statistiche:', error);
      res.status(500).json({ error: 'Errore durante il recupero delle statistiche' });
    }
  }
}
