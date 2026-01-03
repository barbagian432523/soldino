import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export class ContactController {
  // Get all contacts for the authenticated user
  static async getAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      const contacts = await prisma.contact.findMany({
        where: { userId: req.user!.id },
        include: {
          _count: {
            select: { loans: true },
          },
        },
        orderBy: { name: 'asc' },
      });

      res.json({ contacts });
    } catch (error) {
      console.error('Error fetching contacts:', error);
      res.status(500).json({ error: 'Errore nel recupero dei contatti' });
    }
  }

  // Get a single contact by ID
  static async getOne(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const contact = await prisma.contact.findFirst({
        where: {
          id,
          userId: req.user!.id,
        },
        include: {
          _count: {
            select: { loans: true },
          },
          loans: {
            where: { status: 'ACTIVE' },
            orderBy: { loanDate: 'desc' },
          },
        },
      });

      if (!contact) {
        res.status(404).json({ error: 'Contatto non trovato' });
        return;
      }

      res.json({ contact });
    } catch (error) {
      console.error('Error fetching contact:', error);
      res.status(500).json({ error: 'Errore nel recupero del contatto' });
    }
  }

  // Create a new contact
  static async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { name, email, phone, notes } = req.body;

      // Validation
      if (!name || name.trim() === '') {
        res.status(400).json({ error: 'Il nome è obbligatorio' });
        return;
      }

      const contact = await prisma.contact.create({
        data: {
          name: name.trim(),
          email: email?.trim() || null,
          phone: phone?.trim() || null,
          notes: notes?.trim() || null,
          userId: req.user!.id,
        },
        include: {
          _count: {
            select: { loans: true },
          },
        },
      });

      res.status(201).json({ contact });
    } catch (error) {
      console.error('Error creating contact:', error);
      res.status(500).json({ error: 'Errore nella creazione del contatto' });
    }
  }

  // Update a contact
  static async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, email, phone, notes } = req.body;

      // Check if contact exists and belongs to user
      const existingContact = await prisma.contact.findFirst({
        where: {
          id,
          userId: req.user!.id,
        },
      });

      if (!existingContact) {
        res.status(404).json({ error: 'Contatto non trovato' });
        return;
      }

      const contact = await prisma.contact.update({
        where: { id },
        data: {
          ...(name !== undefined && { name: name.trim() }),
          ...(email !== undefined && { email: email?.trim() || null }),
          ...(phone !== undefined && { phone: phone?.trim() || null }),
          ...(notes !== undefined && { notes: notes?.trim() || null }),
        },
        include: {
          _count: {
            select: { loans: true },
          },
        },
      });

      res.json({ contact });
    } catch (error) {
      console.error('Error updating contact:', error);
      res.status(500).json({ error: 'Errore nell\'aggiornamento del contatto' });
    }
  }

  // Delete a contact
  static async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Check if contact exists and belongs to user
      const contact = await prisma.contact.findFirst({
        where: {
          id,
          userId: req.user!.id,
        },
        include: {
          _count: {
            select: { loans: true },
          },
        },
      });

      if (!contact) {
        res.status(404).json({ error: 'Contatto non trovato' });
        return;
      }

      // Check if contact has active loans
      if (contact._count.loans > 0) {
        res.status(400).json({
          error: `Impossibile eliminare: ci sono ${contact._count.loans} prestiti associati a questo contatto`,
        });
        return;
      }

      await prisma.contact.delete({
        where: { id },
      });

      res.json({ message: 'Contatto eliminato con successo' });
    } catch (error) {
      console.error('Error deleting contact:', error);
      res.status(500).json({ error: 'Errore nell\'eliminazione del contatto' });
    }
  }
}
