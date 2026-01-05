import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';
import { OCRService } from '../services/ocrService';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';

export class UploadController {
  /**
   * Calcola hash SHA-256 di un file
   */
  private static async calculateFileHash(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);

      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  /**
   * Upload allegato per una spesa esistente
   */
  static async uploadAttachment(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { expenseId } = req.params;
      const file = req.file;

      if (!file) {
        res.status(400).json({ error: 'Nessun file caricato' });
        return;
      }

      // Verifica che la spesa appartenga all'utente
      const expense = await prisma.expense.findFirst({
        where: { id: expenseId, userId: req.userId },
      });

      if (!expense) {
        res.status(404).json({ error: 'Spesa non trovata' });
        return;
      }

      // Determina il tipo di allegato
      let attachmentType: 'IMAGE' | 'PDF' | 'DOCUMENT' | 'OTHER' = 'OTHER';
      if (file.mimetype.startsWith('image/')) {
        attachmentType = 'IMAGE';
      } else if (file.mimetype === 'application/pdf') {
        attachmentType = 'PDF';
      } else if (
        file.mimetype.includes('document') ||
        file.mimetype.includes('word')
      ) {
        attachmentType = 'DOCUMENT';
      }

      // Calcola hash del file
      const fileHash = await this.calculateFileHash(file.path);

      // Crea allegato
      const attachment = await prisma.attachment.create({
        data: {
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          type: attachmentType,
          path: file.path,
          hash: fileHash,
          expenseId,
        },
      });

      res.status(201).json({
        message: 'Allegato caricato con successo',
        attachment,
      });
    } catch (error) {
      console.error('Errore upload allegato:', error);
      res.status(500).json({ error: 'Errore durante l\'upload dell\'allegato' });
    }
  }

  /**
   * Analizza ricevuta con OCR e crea spesa suggerita
   */
  static async analyzeReceipt(req: AuthRequest, res: Response): Promise<void> {
    try {
      const file = req.file;

      if (!file) {
        res.status(400).json({ error: 'Nessun file caricato' });
        return;
      }

      // Verifica che sia un'immagine
      if (!file.mimetype.startsWith('image/')) {
        res.status(400).json({ error: 'Il file deve essere un\'immagine' });
        return;
      }

      // Analizza con OCR
      const ocrResult = await OCRService.analyzeReceipt(file.path);

      // Cerca categoria corrispondente
      let suggestedCategoryId: string | undefined;
      if (ocrResult.category) {
        const category = await prisma.category.findFirst({
          where: {
            OR: [
              { userId: req.userId },
              { isDefault: true },
            ],
            name: {
              contains: ocrResult.category,
              mode: 'insensitive',
            },
          },
        });
        suggestedCategoryId = category?.id;
      }

      // Ottieni il primo account dell'utente come default
      const defaultAccount = await prisma.account.findFirst({
        where: { userId: req.userId },
        orderBy: { createdAt: 'asc' },
      });

      res.json({
        message: 'Ricevuta analizzata con successo',
        ocr: ocrResult,
        suggestion: {
          amount: ocrResult.amount,
          description: ocrResult.description || ocrResult.merchant || 'Spesa da ricevuta',
          date: ocrResult.date,
          categoryId: suggestedCategoryId,
          accountId: defaultAccount?.id,
          merchant: ocrResult.merchant,
          aiConfidence: ocrResult.confidence,
        },
        uploadedFile: {
          filename: file.filename,
          path: file.path,
          mimetype: file.mimetype,
        },
      });
    } catch (error) {
      console.error('Errore analisi ricevuta:', error);
      res.status(500).json({ error: 'Errore durante l\'analisi della ricevuta' });
    }
  }

  /**
   * Crea spesa da ricevuta analizzata
   */
  static async createFromReceipt(req: AuthRequest, res: Response): Promise<void> {
    try {
      const {
        amount,
        description,
        notes,
        date,
        accountId,
        categoryId,
        filePath,
        aiConfidence,
        aiRawData,
      } = req.body;

      // Validazioni
      if (!amount || !description || !accountId || !categoryId) {
        res.status(400).json({
          error: 'Campi obbligatori mancanti: amount, description, accountId, categoryId',
        });
        return;
      }

      // Verifica account
      const account = await prisma.account.findFirst({
        where: { id: accountId, userId: req.userId },
      });

      if (!account) {
        res.status(404).json({ error: 'Account non trovato' });
        return;
      }

      // Crea spesa
      const expense = await prisma.expense.create({
        data: {
          amount,
          type: 'EXPENSE',
          description,
          notes,
          date: date ? new Date(date) : new Date(),
          userId: req.userId!,
          accountId,
          categoryId,
          isAiGenerated: true,
          aiConfidence,
          aiRawData,
        },
        include: {
          category: true,
          account: true,
        },
      });

      // Se c'è un file, crea l'allegato
      if (filePath) {
        const filename = path.basename(filePath);
        await prisma.attachment.create({
          data: {
            filename,
            originalName: 'receipt.jpg',
            mimeType: 'image/jpeg',
            size: 0,
            type: 'IMAGE',
            path: filePath,
            expenseId: expense.id,
          },
        });
      }

      // Aggiorna balance
      await prisma.account.update({
        where: { id: accountId },
        data: {
          balance: {
            decrement: amount,
          },
        },
      });

      res.status(201).json({
        message: 'Spesa creata con successo da ricevuta',
        expense,
      });
    } catch (error) {
      console.error('Errore creazione spesa da ricevuta:', error);
      res.status(500).json({ error: 'Errore durante la creazione della spesa' });
    }
  }

  /**
   * Elimina un allegato
   */
  static async deleteAttachment(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Verifica proprietà tramite spesa
      const attachment = await prisma.attachment.findFirst({
        where: {
          id,
          expense: {
            userId: req.userId,
          },
        },
      });

      if (!attachment) {
        res.status(404).json({ error: 'Allegato non trovato' });
        return;
      }

      await prisma.attachment.delete({ where: { id } });

      res.json({ message: 'Allegato eliminato con successo' });
    } catch (error) {
      console.error('Errore eliminazione allegato:', error);
      res.status(500).json({ error: 'Errore durante l\'eliminazione dell\'allegato' });
    }
  }
}
