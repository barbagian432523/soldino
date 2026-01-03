import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest, CreateCategoryDTO } from '../types';
import { createAuditLog } from '../services/auditLog';

export class CategoryController {
  /**
   * Ottieni tutte le categorie (di sistema + dell'utente)
   */
  static async getAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      const categories = await prisma.category.findMany({
        where: {
          OR: [
            { userId: req.userId },
            { isDefault: true }, // Categorie di sistema
          ],
        },
        orderBy: { name: 'asc' },
      });

      res.json({ categories });
    } catch (error) {
      console.error('Errore recupero categorie:', error);
      res.status(500).json({ error: 'Errore durante il recupero delle categorie' });
    }
  }

  /**
   * Crea una nuova categoria personalizzata
   */
  static async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data: CreateCategoryDTO = req.body;

      const category = await prisma.category.create({
        data: {
          name: data.name,
          color: data.color || '#3B82F6',
          icon: data.icon,
          description: data.description,
          userId: req.userId!,
        },
      });

      // Audit log
      await createAuditLog({
        userId: req.userId!,
        action: 'CREATE',
        entity: 'Category',
        entityId: category.id,
        description: `Creata categoria: ${category.name}`,
        metadata: { icon: category.icon, color: category.color },
        req,
      });

      res.status(201).json({
        message: 'Categoria creata con successo',
        category,
      });
    } catch (error) {
      console.error('Errore creazione categoria:', error);
      res.status(500).json({ error: 'Errore durante la creazione della categoria' });
    }
  }

  /**
   * Aggiorna una categoria
   */
  static async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data = req.body;

      // Verifica proprietà (solo categorie utente, non quelle di sistema)
      const existing = await prisma.category.findFirst({
        where: { id, userId: req.userId, isDefault: false },
      });

      if (!existing) {
        res.status(404).json({ error: 'Categoria non trovata o non modificabile' });
        return;
      }

      const category = await prisma.category.update({
        where: { id },
        data,
      });

      // Audit log
      await createAuditLog({
        userId: req.userId!,
        action: 'UPDATE',
        entity: 'Category',
        entityId: id,
        description: `Aggiornata categoria: ${category.name}`,
        metadata: { changes: data },
        req,
      });

      res.json({
        message: 'Categoria aggiornata con successo',
        category,
      });
    } catch (error) {
      console.error('Errore aggiornamento categoria:', error);
      res.status(500).json({ error: 'Errore durante l\'aggiornamento della categoria' });
    }
  }

  /**
   * Elimina una categoria
   */
  static async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Verifica proprietà (solo categorie utente, non quelle di sistema)
      const existing = await prisma.category.findFirst({
        where: { id, userId: req.userId, isDefault: false },
      });

      if (!existing) {
        res.status(404).json({ error: 'Categoria non trovata o non eliminabile' });
        return;
      }

      // Verifica se ci sono spese collegate
      const expenseCount = await prisma.expense.count({
        where: { categoryId: id },
      });

      if (expenseCount > 0) {
        res.status(400).json({
          error: 'Impossibile eliminare la categoria: ci sono spese collegate',
        });
        return;
      }

      await prisma.category.delete({ where: { id } });

      // Audit log
      await createAuditLog({
        userId: req.userId!,
        action: 'DELETE',
        entity: 'Category',
        entityId: id,
        description: `Eliminata categoria: ${existing.name}`,
        metadata: { icon: existing.icon, color: existing.color },
        req,
      });

      res.json({ message: 'Categoria eliminata con successo' });
    } catch (error) {
      console.error('Errore eliminazione categoria:', error);
      res.status(500).json({ error: 'Errore durante l\'eliminazione della categoria' });
    }
  }
}
