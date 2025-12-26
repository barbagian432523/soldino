export const formatCurrency = (amount: number, currency = 'EUR'): string => {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency,
  }).format(amount);
};

export const formatDate = (date: string | Date): string => {
  return new Intl.DateTimeFormat('it-IT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
};

export const formatDateShort = (date: string | Date): string => {
  return new Intl.DateTimeFormat('it-IT', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(date));
};

export const formatRelativeTime = (date: string | Date): string => {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Oggi';
  if (diffDays === 1) return 'Ieri';
  if (diffDays < 7) return `${diffDays} giorni fa`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} settimane fa`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} mesi fa`;
  return `${Math.floor(diffDays / 365)} anni fa`;
};

export const getAccountTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    CHECKING: 'Conto Corrente',
    SAVINGS: 'Conto Risparmio',
    CASH: 'Contanti',
    CREDIT_CARD: 'Carta di Credito',
    INVESTMENT: 'Investimenti',
    OTHER: 'Altro',
  };
  return labels[type] || type;
};

export const getExpenseTypeLabel = (type: string): string => {
  return type === 'EXPENSE' ? 'Spesa' : 'Entrata';
};

export const getExpenseStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    PENDING: 'In attesa',
    COMPLETED: 'Completata',
    CANCELLED: 'Annullata',
  };
  return labels[status] || status;
};
