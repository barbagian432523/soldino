import { PrismaClient, RecurringFrequency } from '@prisma/client';
import { addDays, addWeeks, addMonths, addQuarters, addYears, isBefore, isAfter } from 'date-fns';

const prisma = new PrismaClient();

/**
 * Calcola la prossima data basata sulla frequenza
 */
function getNextDate(currentDate: Date, frequency: RecurringFrequency): Date {
  switch (frequency) {
    case 'DAILY':
      return addDays(currentDate, 1);
    case 'WEEKLY':
      return addWeeks(currentDate, 1);
    case 'BIWEEKLY':
      return addWeeks(currentDate, 2);
    case 'MONTHLY':
      return addMonths(currentDate, 1);
    case 'QUARTERLY':
      return addQuarters(currentDate, 1);
    case 'YEARLY':
      return addYears(currentDate, 1);
    default:
      return currentDate;
  }
}

/**
 * Genera spese ricorrenti per tutte le spese attive
 * Questa funzione dovrebbe essere chiamata periodicamente (es. cron job)
 */
export async function generateRecurringExpenses() {
  const now = new Date();

  // Trova tutte le spese ricorrenti attive
  const recurringExpenses = await prisma.expense.findMany({
    where: {
      isRecurring: true,
      recurringFrequency: { not: null },
      OR: [
        { recurringEndDate: null }, // Nessuna data fine
        { recurringEndDate: { gte: now } }, // Data fine non ancora raggiunta
      ],
    },
  });

  const generatedExpenses = [];

  for (const expense of recurringExpenses) {
    if (!expense.recurringFrequency) continue;

    // Determina da quale data iniziare a generare
    const startDate = expense.recurringLastGenerated || expense.recurringStartDate || expense.date;
    let nextDate = getNextDate(startDate, expense.recurringFrequency);

    // Genera tutte le spese fino ad oggi
    while (isBefore(nextDate, now) || nextDate.toDateString() === now.toDateString()) {
      // Verifica che non superi la data fine (se presente)
      if (expense.recurringEndDate && isAfter(nextDate, expense.recurringEndDate)) {
        break;
      }

      // Crea la nuova spesa
      const newExpense = await prisma.expense.create({
        data: {
          amount: expense.amount,
          type: expense.type,
          description: expense.description,
          notes: expense.notes,
          date: nextDate,
          status: 'COMPLETED',
          userId: expense.userId,
          accountId: expense.accountId,
          categoryId: expense.categoryId,
          isRecurring: false,
          isRecurringGenerated: true,
          parentRecurringId: expense.id,
          location: expense.location,
          latitude: expense.latitude,
          longitude: expense.longitude,
        },
      });

      generatedExpenses.push(newExpense);

      // Aggiorna l'ultima data generata
      await prisma.expense.update({
        where: { id: expense.id },
        data: {
          recurringLastGenerated: nextDate,
        },
      });

      // Passa alla prossima occorrenza
      nextDate = getNextDate(nextDate, expense.recurringFrequency);
    }
  }

  return generatedExpenses;
}

/**
 * Ottiene le prossime occorrenze di una spesa ricorrente
 */
export function getNextOccurrences(
  expense: any,
  count: number = 5
): Date[] {
  if (!expense.isRecurring || !expense.recurringFrequency) {
    return [];
  }

  const occurrences: Date[] = [];
  const startDate = expense.recurringLastGenerated || expense.recurringStartDate || expense.date;
  let nextDate = getNextDate(startDate, expense.recurringFrequency);

  for (let i = 0; i < count; i++) {
    // Verifica data fine
    if (expense.recurringEndDate && isAfter(nextDate, expense.recurringEndDate)) {
      break;
    }

    occurrences.push(nextDate);
    nextDate = getNextDate(nextDate, expense.recurringFrequency);
  }

  return occurrences;
}

/**
 * Disabilita una spesa ricorrente
 */
export async function disableRecurring(expenseId: string) {
  return await prisma.expense.update({
    where: { id: expenseId },
    data: {
      isRecurring: false,
      recurringFrequency: null,
      recurringStartDate: null,
      recurringEndDate: null,
    },
  });
}

/**
 * Ottiene statistiche sulle spese ricorrenti
 */
export async function getRecurringStats(userId: string) {
  const [activeRecurring, totalGenerated, monthlyImpact] = await Promise.all([
    // Spese ricorrenti attive
    prisma.expense.count({
      where: {
        userId,
        isRecurring: true,
      },
    }),

    // Totale spese generate automaticamente
    prisma.expense.count({
      where: {
        userId,
        isRecurringGenerated: true,
      },
    }),

    // Impatto mensile stimato
    prisma.expense.aggregate({
      where: {
        userId,
        isRecurring: true,
        type: 'EXPENSE',
      },
      _sum: {
        amount: true,
      },
    }),
  ]);

  return {
    activeRecurring,
    totalGenerated,
    monthlyImpact: monthlyImpact._sum.amount || 0,
  };
}
