import express from 'express';
import { authenticate } from '../middleware/auth';
import { getAuditLogs, getAuditStats } from '../services/auditLog';
import { AuditAction } from '@prisma/client';

const router = express.Router();

/**
 * GET /api/audit-logs
 * Recupera i log di audit con filtri
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const {
      action,
      entity,
      startDate,
      endDate,
      limit,
      offset,
    } = req.query;

    const filters: any = {};

    if (action && Object.values(AuditAction).includes(action as AuditAction)) {
      filters.action = action as AuditAction;
    }

    if (entity) {
      filters.entity = entity as string;
    }

    if (startDate) {
      filters.startDate = new Date(startDate as string);
    }

    if (endDate) {
      filters.endDate = new Date(endDate as string);
    }

    if (limit) {
      filters.limit = parseInt(limit as string, 10);
    }

    if (offset) {
      filters.offset = parseInt(offset as string, 10);
    }

    const result = await getAuditLogs(req.userId!, filters);

    res.json(result);
  } catch (error: any) {
    console.error('Errore recupero audit logs:', error);
    res.status(500).json({ message: 'Errore recupero log' });
  }
});

/**
 * GET /api/audit-logs/stats
 * Ottiene statistiche sui log di audit
 */
router.get('/stats', authenticate, async (req, res) => {
  try {
    const stats = await getAuditStats(req.userId!);
    res.json(stats);
  } catch (error: any) {
    console.error('Errore recupero statistiche audit:', error);
    res.status(500).json({ message: 'Errore recupero statistiche' });
  }
});

export default router;
