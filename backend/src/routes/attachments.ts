import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  upload,
  createAttachment,
  deleteAttachment,
  findDuplicateByHash,
} from '../services/fileUpload';
import { createAuditLog } from '../services/auditLog';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * POST /api/attachments/upload
 * Upload multipli allegati per una spesa
 */
router.post(
  '/upload',
  authenticate,
  upload.array('files', 10), // Max 10 file per volta
  async (req, res) => {
    try {
      const { expenseId } = req.body;
      const files = req.files as Express.Multer.File[];

      if (!expenseId) {
        return res.status(400).json({ message: 'expenseId richiesto' });
      }

      if (!files || files.length === 0) {
        return res.status(400).json({ message: 'Nessun file caricato' });
      }

      // Verifica che la spesa esista e appartenga all'utente
      const expense = await prisma.expense.findFirst({
        where: {
          id: expenseId,
          userId: req.userId!,
        },
      });

      if (!expense) {
        // Elimina file caricati se la spesa non esiste
        files.forEach((file) => {
          fs.unlinkSync(file.path);
        });
        return res.status(404).json({ message: 'Spesa non trovata' });
      }

      // Crea attachment per ogni file
      const attachments = await Promise.all(
        files.map((file) => createAttachment(file, expenseId))
      );

      // Log audit
      await createAuditLog({
        userId: req.userId!,
        action: 'UPLOAD',
        entity: 'Attachment',
        description: `Caricati ${files.length} allegati per spesa ${expense.description}`,
        metadata: {
          expenseId,
          attachmentIds: attachments.map((a) => a.id),
          totalSize: files.reduce((sum, f) => sum + f.size, 0),
        },
        req,
      });

      res.json({
        message: 'File caricati con successo',
        attachments,
      });
    } catch (error: any) {
      console.error('Errore upload:', error);
      res.status(500).json({ message: error.message || 'Errore upload file' });
    }
  }
);

/**
 * GET /api/attachments/:id
 * Download attachment
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const attachment = await prisma.attachment.findFirst({
      where: {
        id,
        expense: {
          userId: req.userId!,
        },
      },
    });

    if (!attachment) {
      return res.status(404).json({ message: 'Allegato non trovato' });
    }

    // Verifica che il file esista
    if (!fs.existsSync(attachment.path)) {
      return res.status(404).json({ message: 'File non trovato sul server' });
    }

    // Log audit
    await createAuditLog({
      userId: req.userId!,
      action: 'DOWNLOAD',
      entity: 'Attachment',
      entityId: id,
      description: `Download allegato ${attachment.originalName}`,
      req,
    });

    // Imposta headers per download
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${attachment.originalName}"`
    );
    res.setHeader('Content-Type', attachment.mimeType);

    // Stream del file
    const fileStream = fs.createReadStream(attachment.path);
    fileStream.pipe(res);
  } catch (error: any) {
    console.error('Errore download:', error);
    res.status(500).json({ message: 'Errore download file' });
  }
});

/**
 * DELETE /api/attachments/:id
 * Elimina attachment
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Verifica ownership
    const attachment = await prisma.attachment.findFirst({
      where: {
        id,
        expense: {
          userId: req.userId!,
        },
      },
      include: {
        expense: {
          select: {
            description: true,
          },
        },
      },
    });

    if (!attachment) {
      return res.status(404).json({ message: 'Allegato non trovato' });
    }

    await deleteAttachment(id);

    // Log audit
    await createAuditLog({
      userId: req.userId!,
      action: 'DELETE',
      entity: 'Attachment',
      entityId: id,
      description: `Eliminato allegato ${attachment.originalName}`,
      metadata: {
        expenseDescription: attachment.expense.description,
      },
      req,
    });

    res.json({ message: 'Allegato eliminato con successo' });
  } catch (error: any) {
    console.error('Errore eliminazione:', error);
    res.status(500).json({ message: 'Errore eliminazione allegato' });
  }
});

/**
 * GET /api/attachments/expense/:expenseId
 * Ottieni tutti gli allegati di una spesa
 */
router.get('/expense/:expenseId', authenticate, async (req, res) => {
  try {
    const { expenseId } = req.params;

    const attachments = await prisma.attachment.findMany({
      where: {
        expenseId,
        expense: {
          userId: req.userId!,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(attachments);
  } catch (error: any) {
    console.error('Errore recupero allegati:', error);
    res.status(500).json({ message: 'Errore recupero allegati' });
  }
});

/**
 * POST /api/attachments/check-duplicate
 * Verifica se esiste un file duplicato tramite hash
 */
router.post('/check-duplicate', authenticate, async (req, res) => {
  try {
    const { hash } = req.body;

    if (!hash) {
      return res.status(400).json({ message: 'Hash richiesto' });
    }

    const duplicate = await findDuplicateByHash(hash);

    res.json({
      isDuplicate: !!duplicate,
      duplicate,
    });
  } catch (error: any) {
    console.error('Errore verifica duplicati:', error);
    res.status(500).json({ message: 'Errore verifica duplicati' });
  }
});

export default router;
