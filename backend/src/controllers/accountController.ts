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
      const data = req.body;

      // Verifica proprietà
      const existing = await prisma.account.findFirst({
        where: { id, userId: req.userId },
      });

      if (!existing) {
        res.status(404).json({ error: 'Account non trovato' });
        return;
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
}
