import express from 'express';
import { authenticate } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const router = express.Router();
const prisma = new PrismaClient();
const execAsync = promisify(exec);

/**
 * GET /api/stats/system
 * Ottiene statistiche di sistema (DB size, numero operazioni, etc.)
 */
router.get('/system', authenticate, async (req, res) => {
  try {
    const userId = req.userId!;

    // Statistiche parallele
    const [
      totalExpenses,
      totalAccounts,
      totalCategories,
      totalAttachments,
      totalLoans,
      totalAuditLogs,
      attachmentsSize,
      recentActivity,
    ] = await Promise.all([
      // Totale spese
      prisma.expense.count({ where: { userId } }),

      // Totale conti
      prisma.account.count({ where: { userId } }),

      // Totale categorie
      prisma.category.count({
        where: {
          OR: [{ userId }, { userId: null }],
        },
      }),

      // Totale allegati
      prisma.attachment.count({
        where: {
          expense: { userId },
        },
      }),

      // Totale prestiti
      prisma.loan.count({ where: { userId } }),

      // Totale log di audit
      prisma.auditLog.count({ where: { userId } }),

      // Dimensione totale allegati
      prisma.attachment.aggregate({
        where: {
          expense: { userId },
        },
        _sum: {
          size: true,
        },
      }),

      // Attività recente (ultimi 7 giorni)
      prisma.expense.count({
        where: {
          userId,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    // Ottieni dimensione database (solo su PostgreSQL)
    let dbSize = 0;
    try {
      const result = await prisma.$queryRaw<any[]>`
        SELECT pg_database_size(current_database()) as size
      `;
      dbSize = Number(result[0]?.size) || 0;
    } catch (error) {
      console.error('Errore recupero dimensione DB:', error);
      dbSize = 0;
    }

    // Formato human-readable per le dimensioni
    const formatBytes = (bytes: number) => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
    };

    res.json({
      database: {
        size: dbSize,
        sizeFormatted: formatBytes(dbSize),
      },
      counts: {
        expenses: totalExpenses,
        accounts: totalAccounts,
        categories: totalCategories,
        attachments: totalAttachments,
        loans: totalLoans,
        auditLogs: totalAuditLogs,
      },
      attachments: {
        totalSize: attachmentsSize._sum.size || 0,
        totalSizeFormatted: formatBytes(attachmentsSize._sum.size || 0),
        count: totalAttachments,
      },
      activity: {
        recentExpenses: recentActivity,
        last7Days: recentActivity,
      },
    });
  } catch (error: any) {
    console.error('Errore recupero statistiche sistema:', error);
    res.status(500).json({ message: 'Errore recupero statistiche' });
  }
});

/**
 * GET /api/stats/dashboard
 * Statistiche rapide per il dashboard header
 */
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const userId = req.userId!;

    const [totalExpenses, totalOperations, dbInfo] = await Promise.all([
      // Totale spese
      prisma.expense.count({ where: { userId } }),

      // Totale operazioni (somma di tutte le entità)
      Promise.all([
        prisma.expense.count({ where: { userId } }),
        prisma.account.count({ where: { userId } }),
        prisma.category.count({ where: { OR: [{ userId }, { userId: null }] } }),
        prisma.loan.count({ where: { userId } }),
        prisma.contact.count({ where: { userId } }),
      ]).then((counts) => counts.reduce((sum, count) => sum + count, 0)),

      // Info DB
      (async () => {
        try {
          const result = await prisma.$queryRaw<any[]>`
            SELECT pg_database_size(current_database()) as size
          `;
          return Number(result[0]?.size) || 0;
        } catch (err) {
          console.error('Errore recupero dimensione DB:', err);
          return 0;
        }
      })(),
    ]);

    res.json({
      totalExpenses,
      totalOperations,
      dbSize: dbInfo,
      dbSizeFormatted: formatBytes(dbInfo),
    });
  } catch (error: any) {
    console.error('Errore recupero statistiche dashboard:', error);
    res.status(500).json({ message: 'Errore recupero statistiche' });
  }
});

// Helper function
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export default router;
