import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest, CreateAccountDTO } from '../types';

export class AccountController {
  /**
   * Ottieni tutti gli account dell'utente
   */
  static async getAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      const accounts = await prisma.account.findMany({
        where: { userId: req.userId },
        orderBy: { createdAt: 'desc' },
      });

      res.json({ accounts });
    } catch (error) {
      console.error('Errore recupero account:', error);
      res.status(500).json({ error: 'Errore durante il recupero degli account' });
    }
  }

  /**
   * Crea un nuovo account
   */
  static async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data: CreateAccountDTO = req.body;

      const account = await prisma.account.create({
        data: {
          name: data.name,
          type: data.type,
          balance: data.balance || 0,
          currency: data.currency || 'EUR',
          color: data.color,
          icon: data.icon,
          description: data.description,
          userId: req.userId!,
        },
      });

      res.status(201).json({
        message: 'Account creato con successo',
        account,
      });
    } catch (error) {
      console.error('Errore creazione account:', error);
      res.status(500).json({ error: 'Errore durante la creazione dell\'account' });
    }
  }

  /**
   * Aggiorna un account
   */
  static async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const body = req.body;

      // Verifica proprietà
      const existing = await prisma.account.findFirst({
        where: { id, userId: req.userId },
      });

      if (!existing) {
        res.status(404).json({ error: 'Account non trovato' });
        return;
      }

      // Whitelist dei campi modificabili (previene data injection)
      const allowedFields = ['name', 'type', 'balance', 'currency', 'color', 'icon', 'description'];
      const data: any = {};

      for (const field of allowedFields) {
        if (body[field] !== undefined) {
          data[field] = body[field];
        }
      }

      const account = await prisma.account.update({
        where: { id },
        data,
      });

      res.json({
        message: 'Account aggiornato con successo',
        account,
      });
    } catch (error) {
      console.error('Errore aggiornamento account:', error);
      res.status(500).json({ error: 'Errore durante l\'aggiornamento dell\'account' });
    }
  }

  /**
   * Elimina un account
   */
  static async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Verifica proprietà
      const existing = await prisma.account.findFirst({
        where: { id, userId: req.userId },
      });

      if (!existing) {
        res.status(404).json({ error: 'Account non trovato' });
        return;
      }

      // Verifica se ci sono spese associate (previene dati orfani)
      const expenseCount = await prisma.expense.count({
        where: { accountId: id },
      });

      if (expenseCount > 0) {
        res.status(400).json({
          error: 'Impossibile eliminare l\'account',
          message: `L'account contiene ${expenseCount} spese. Elimina prima tutte le spese associate o spostale su un altro account.`,
        });
        return;
      }

      await prisma.account.delete({ where: { id } });

      res.json({ message: 'Account eliminato con successo' });
    } catch (error) {
      console.error('Errore eliminazione account:', error);
      res.status(500).json({ error: 'Errore durante l\'eliminazione dell\'account' });
    }
  }

  /**
   * Ottieni statistiche account
   */
  static async getStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const accounts = await prisma.account.findMany({
        where: { userId: req.userId },
        include: {
          _count: {
            select: { expenses: true },
          },
        },
      });

      const totalBalance = accounts.reduce(
        (sum, acc) => sum + Number(acc.balance),
        0
      );

      const stats = {
        totalAccounts: accounts.length,
        totalBalance,
        accountsByType: accounts.reduce((acc, account) => {
          acc[account.type] = (acc[account.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      };

      res.json({ stats, accounts });
    } catch (error) {
      console.error('Errore recupero statistiche:', error);
      res.status(500).json({ error: 'Errore durante il recupero delle statistiche' });
    }
  }

  /**
   * Aggiusta il saldo di un account manualmente
   */
  static async adjustBalance(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { amount, reason } = req.body;

      if (amount === undefined || amount === null) {
        res.status(400).json({ error: 'Amount è richiesto' });
        return;
      }

      // Verifica proprietà
      const existing = await prisma.account.findFirst({
        where: { id, userId: req.userId },
      });

      if (!existing) {
        res.status(404).json({ error: 'Account non trovato' });
        return;
      }

      // Aggiorna saldo
      const account = await prisma.account.update({
        where: { id },
        data: {
          balance: Number(amount),
        },
      });

      // Crea audit log
      const { createAuditLog } = await import('../services/auditLog');
      await createAuditLog({
        userId: req.userId!,
        action: 'UPDATE',
        entity: 'Account',
        entityId: id,
        description: `Aggiustamento saldo account ${existing.name}: ${existing.balance} → ${amount}`,
        metadata: {
          oldBalance: existing.balance.toString(),
          newBalance: amount.toString(),
          reason: reason || 'Nessuna ragione specificata',
        },
        req,
      });

      res.json({
        message: 'Saldo aggiustato con successo',
        account,
      });
    } catch (error) {
      console.error('Errore aggiustamento saldo:', error);
      res.status(500).json({ error: 'Errore durante l\'aggiustamento del saldo' });
    }
  }

  /**
   * Trasferisci denaro tra due account (giroconto)
   */
  static async transfer(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { fromAccountId, toAccountId, amount, description, date } = req.body;

      if (!fromAccountId || !toAccountId || !amount) {
        res.status(400).json({ error: 'fromAccountId, toAccountId e amount sono richiesti' });
        return;
      }

      if (fromAccountId === toAccountId) {
        res.status(400).json({ error: 'Non puoi trasferire denaro allo stesso account' });
        return;
      }

      const numericAmount = Number(amount);
      if (numericAmount <= 0) {
        res.status(400).json({ error: 'L\'importo deve essere positivo' });
        return;
      }

      // Verifica proprietà di entrambi gli account
      const [fromAccount, toAccount] = await Promise.all([
        prisma.account.findFirst({
          where: { id: fromAccountId, userId: req.userId },
        }),
        prisma.account.findFirst({
          where: { id: toAccountId, userId: req.userId },
        }),
      ]);

      if (!fromAccount) {
        res.status(404).json({ error: 'Account di origine non trovato' });
        return;
      }

      if (!toAccount) {
        res.status(404).json({ error: 'Account di destinazione non trovato' });
        return;
      }

      // Trova o crea categoria "Trasferimenti"
      let transferCategory = await prisma.category.findFirst({
        where: {
          name: 'Trasferimenti',
          OR: [{ userId: req.userId }, { isDefault: true }],
        },
      });

      if (!transferCategory) {
        transferCategory = await prisma.category.create({
          data: {
            name: 'Trasferimenti',
            icon: '🔄',
            color: '#6366F1',
            description: 'Categoria per trasferimenti tra conti',
            userId: req.userId,
          },
        });
      }

      // Crea due spese collegate in una transazione
      const transferDate = date ? new Date(date) : new Date();
      const transferDescription = description || `Trasferimento da ${fromAccount.name} a ${toAccount.name}`;

      await prisma.$transaction(async (tx) => {
        // Spesa dal conto di origine (negativa)
        await tx.expense.create({
          data: {
            amount: numericAmount,
            type: 'EXPENSE',
            description: transferDescription,
            notes: `Trasferito a ${toAccount.name}`,
            date: transferDate,
            userId: req.userId!,
            accountId: fromAccountId,
            categoryId: transferCategory.id,
          },
        });

        // Entrata nel conto di destinazione (positiva)
        await tx.expense.create({
          data: {
            amount: numericAmount,
            type: 'INCOME',
            description: transferDescription,
            notes: `Ricevuto da ${fromAccount.name}`,
            date: transferDate,
            userId: req.userId!,
            accountId: toAccountId,
            categoryId: transferCategory.id,
          },
        });

        // Aggiorna saldi
        await tx.account.update({
          where: { id: fromAccountId },
          data: {
            balance: {
              decrement: numericAmount,
            },
          },
        });

        await tx.account.update({
          where: { id: toAccountId },
          data: {
            balance: {
              increment: numericAmount,
            },
          },
        });
      });

      // Crea audit log
      const { createAuditLog } = await import('../services/auditLog');
      await createAuditLog({
        userId: req.userId!,
        action: 'CREATE',
        entity: 'Transfer',
        description: `Trasferimento di €${numericAmount} da ${fromAccount.name} a ${toAccount.name}`,
        metadata: {
          fromAccountId,
          fromAccountName: fromAccount.name,
          toAccountId,
          toAccountName: toAccount.name,
          amount: numericAmount,
          description: transferDescription,
        },
        req,
      });

      res.json({
        message: 'Trasferimento completato con successo',
        transfer: {
          fromAccount: fromAccount.name,
          toAccount: toAccount.name,
          amount: numericAmount,
          description: transferDescription,
        },
      });
    } catch (error) {
      console.error('Errore trasferimento:', error);
      res.status(500).json({ error: 'Errore durante il trasferimento' });
    }
  }
}
