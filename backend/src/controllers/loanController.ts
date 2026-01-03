import { Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export class LoanController {
  // Get all loans for the authenticated user
  static async getAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { contactId, status, type } = req.query;

      const where: Prisma.LoanWhereInput = {
        userId: req.user!.id,
        ...(contactId && { contactId: contactId as string }),
        ...(status && { status: status as any }),
        ...(type && { type: type as any }),
      };

      const loans = await prisma.loan.findMany({
        where,
        include: {
          contact: true,
        },
        orderBy: [
          { status: 'asc' }, // ACTIVE first
          { loanDate: 'desc' },
        ],
      });

      res.json({ loans });
    } catch (error) {
      console.error('Error fetching loans:', error);
      res.status(500).json({ error: 'Errore nel recupero dei prestiti' });
    }
  }

  // Get a single loan by ID
  static async getOne(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const loan = await prisma.loan.findFirst({
        where: {
          id,
          userId: req.user!.id,
        },
        include: {
          contact: true,
        },
      });

      if (!loan) {
        res.status(404).json({ error: 'Prestito non trovato' });
        return;
      }

      res.json({ loan });
    } catch (error) {
      console.error('Error fetching loan:', error);
      res.status(500).json({ error: 'Errore nel recupero del prestito' });
    }
  }

  // Get loan summary
  static async getSummary(req: AuthRequest, res: Response): Promise<void> {
    try {
      const loans = await prisma.loan.findMany({
        where: {
          userId: req.user!.id,
          status: 'ACTIVE',
        },
      });

      const totalLent = loans
        .filter(l => l.type === 'LENT')
        .reduce((sum, l) => sum + Number(l.remainingAmount), 0);

      const totalBorrowed = loans
        .filter(l => l.type === 'BORROWED')
        .reduce((sum, l) => sum + Number(l.remainingAmount), 0);

      const summary = {
        totalLent,
        totalBorrowed,
        netBalance: totalLent - totalBorrowed,
        activeLentCount: loans.filter(l => l.type === 'LENT').length,
        activeBorrowedCount: loans.filter(l => l.type === 'BORROWED').length,
      };

      res.json({ summary });
    } catch (error) {
      console.error('Error fetching loan summary:', error);
      res.status(500).json({ error: 'Errore nel calcolo del riepilogo' });
    }
  }

  // Create a new loan
  static async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { type, amount, description, notes, loanDate, dueDate, contactId } = req.body;

      // Validation
      if (!type || !['LENT', 'BORROWED'].includes(type)) {
        res.status(400).json({ error: 'Tipo di prestito non valido' });
        return;
      }

      if (!amount || amount <= 0) {
        res.status(400).json({ error: 'L\'importo deve essere maggiore di zero' });
        return;
      }

      if (!description || description.trim() === '') {
        res.status(400).json({ error: 'La descrizione è obbligatoria' });
        return;
      }

      if (!contactId) {
        res.status(400).json({ error: 'Il contatto è obbligatorio' });
        return;
      }

      // Check if contact exists and belongs to user
      const contact = await prisma.contact.findFirst({
        where: {
          id: contactId,
          userId: req.user!.id,
        },
      });

      if (!contact) {
        res.status(404).json({ error: 'Contatto non trovato' });
        return;
      }

      const loan = await prisma.loan.create({
        data: {
          type,
          amount,
          remainingAmount: amount,
          description: description.trim(),
          notes: notes?.trim() || null,
          loanDate: loanDate ? new Date(loanDate) : new Date(),
          dueDate: dueDate ? new Date(dueDate) : null,
          userId: req.user!.id,
          contactId,
        },
        include: {
          contact: true,
        },
      });

      res.status(201).json({ loan });
    } catch (error) {
      console.error('Error creating loan:', error);
      res.status(500).json({ error: 'Errore nella creazione del prestito' });
    }
  }

  // Update a loan
  static async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { amount, remainingAmount, description, notes, loanDate, dueDate, status } = req.body;

      // Check if loan exists and belongs to user
      const existingLoan = await prisma.loan.findFirst({
        where: {
          id,
          userId: req.user!.id,
        },
      });

      if (!existingLoan) {
        res.status(404).json({ error: 'Prestito non trovato' });
        return;
      }

      const loan = await prisma.loan.update({
        where: { id },
        data: {
          ...(amount !== undefined && { amount }),
          ...(remainingAmount !== undefined && { remainingAmount }),
          ...(description !== undefined && { description: description.trim() }),
          ...(notes !== undefined && { notes: notes?.trim() || null }),
          ...(loanDate !== undefined && { loanDate: new Date(loanDate) }),
          ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
          ...(status !== undefined && { status }),
        },
        include: {
          contact: true,
        },
      });

      res.json({ loan });
    } catch (error) {
      console.error('Error updating loan:', error);
      res.status(500).json({ error: 'Errore nell\'aggiornamento del prestito' });
    }
  }

  // Delete a loan
  static async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Check if loan exists and belongs to user
      const loan = await prisma.loan.findFirst({
        where: {
          id,
          userId: req.user!.id,
        },
      });

      if (!loan) {
        res.status(404).json({ error: 'Prestito non trovato' });
        return;
      }

      await prisma.loan.delete({
        where: { id },
      });

      res.json({ message: 'Prestito eliminato con successo' });
    } catch (error) {
      console.error('Error deleting loan:', error);
      res.status(500).json({ error: 'Errore nell\'eliminazione del prestito' });
    }
  }

  // Mark loan as paid
  static async markAsPaid(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Check if loan exists and belongs to user
      const existingLoan = await prisma.loan.findFirst({
        where: {
          id,
          userId: req.user!.id,
        },
      });

      if (!existingLoan) {
        res.status(404).json({ error: 'Prestito non trovato' });
        return;
      }

      const loan = await prisma.loan.update({
        where: { id },
        data: {
          status: 'PAID',
          remainingAmount: 0,
        },
        include: {
          contact: true,
        },
      });

      res.json({ loan });
    } catch (error) {
      console.error('Error marking loan as paid:', error);
      res.status(500).json({ error: 'Errore nell\'aggiornamento dello stato' });
    }
  }

  // Record a payment
  static async recordPayment(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { amount } = req.body;

      if (!amount || amount <= 0) {
        res.status(400).json({ error: 'L\'importo deve essere maggiore di zero' });
        return;
      }

      // Check if loan exists and belongs to user
      const existingLoan = await prisma.loan.findFirst({
        where: {
          id,
          userId: req.user!.id,
        },
      });

      if (!existingLoan) {
        res.status(404).json({ error: 'Prestito non trovato' });
        return;
      }

      if (existingLoan.status !== 'ACTIVE') {
        res.status(400).json({ error: 'Il prestito non è attivo' });
        return;
      }

      const currentRemaining = Number(existingLoan.remainingAmount);

      if (amount > currentRemaining) {
        res.status(400).json({ error: 'L\'importo supera il debito rimanente' });
        return;
      }

      const newRemaining = currentRemaining - amount;
      const newStatus = newRemaining === 0 ? 'PAID' : 'ACTIVE';

      const loan = await prisma.loan.update({
        where: { id },
        data: {
          remainingAmount: newRemaining,
          status: newStatus,
        },
        include: {
          contact: true,
        },
      });

      res.json({ loan });
    } catch (error) {
      console.error('Error recording payment:', error);
      res.status(500).json({ error: 'Errore nella registrazione del pagamento' });
    }
  }
}
