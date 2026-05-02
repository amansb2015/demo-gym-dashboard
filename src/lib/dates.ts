import { differenceInCalendarDays, format, isSameDay, parseISO } from 'date-fns';

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export function formatDate(value?: string | null) {
  if (!value) return 'Not set';
  return format(parseISO(value), 'dd MMM yyyy');
}

export function formatDateTime(value?: string | null) {
  if (!value) return 'Not set';
  return format(parseISO(value), 'dd MMM, h:mm a');
}

export function todayISODate() {
  return new Date().toISOString().slice(0, 10);
}

export function expiryLabel(expiryDate: string) {
  const days = differenceInCalendarDays(parseISO(expiryDate), new Date());
  if (days < 0) return { label: `${Math.abs(days)}d overdue`, tone: 'danger' as const };
  if (days === 0) return { label: 'Expires today', tone: 'warning' as const };
  if (days <= 3) return { label: `${days}d left`, tone: 'warning' as const };
  if (days <= 7) return { label: `${days}d left`, tone: 'notice' as const };
  return { label: 'Active', tone: 'success' as const };
}

export function isToday(value: string) {
  return isSameDay(parseISO(value), new Date());
}
