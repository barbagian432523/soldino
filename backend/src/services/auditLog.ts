import { PrismaClient, AuditAction } from '@prisma/client';
import { Request } from 'express';

const prisma = new PrismaClient();

interface AuditLogData {
  userId: string;
  action: AuditAction;
  entity: string;
  entityId?: string;
  description: string;
  metadata?: any;
  req?: Request;
}

/**
 * Crea un log di audit
 */
export async function createAuditLog(data: AuditLogData) {
  try {
    const ipAddress = data.req
      ? (data.req.headers['x-forwarded-for'] as string) ||
        (data.req.headers['x-real-ip'] as string) ||
        data.req.socket.remoteAddress
      : undefined;

    const userAgent = data.req
      ? (data.req.headers['user-agent'] as string)
      : undefined;

    return await prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        description: data.description,
        metadata: data.metadata,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    console.error('Errore creazione audit log:', error);
    // Non bloccare l'operazione principale se il log fallisce
    return null;
  }
}

/**
 * Recupera i log di audit con filtri
 */
export async function getAuditLogs(
  userId: string,
  filters?: {
    action?: AuditAction;
    entity?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }
) {
  const where: any = { userId };

  if (filters?.action) {
    where.action = filters.action;
  }

  if (filters?.entity) {
    where.entity = filters.entity;
  }

  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {};
    if (filters.startDate) {
      where.createdAt.gte = filters.startDate;
    }
    if (filters.endDate) {
      where.createdAt.lte = filters.endDate;
    }
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: filters?.limit || 100,
      skip: filters?.offset || 0,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total };
}

/**
 * Ottiene statistiche sui log di audit
 */
export async function getAuditStats(userId: string) {
  const [totalLogs, actionCounts, recentActivity] = await Promise.all([
    // Totale log
    prisma.auditLog.count({ where: { userId } }),

    // Conteggio per azione
    prisma.auditLog.groupBy({
      by: ['action'],
      where: { userId },
      _count: {
        action: true,
      },
    }),

    // Attività recente (ultimi 7 giorni)
    prisma.auditLog.count({
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    }),
  ]);

  return {
    totalLogs,
    actionCounts: actionCounts.reduce(
      (acc, item) => {
        acc[item.action] = item._count.action;
        return acc;
      },
      {} as Record<string, number>
    ),
    recentActivity,
  };
}
