import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import confetti from 'canvas-confetti';
import { Priority, TaskStatus } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function triggerCompletionConfetti() {
  try {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#6366f1', '#10b981', '#f59e0b', '#ec4899'],
    });
  } catch {
    // Ignore in unsupported environments
  }
}

function parseLocalDateValue(value: string): Date | null {
  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return date.getFullYear() === Number(year) &&
      date.getMonth() === Number(month) - 1 &&
      date.getDate() === Number(day)
      ? date
      : null;
  }

  const timestamp = new Date(value);
  return Number.isNaN(timestamp.getTime()) ? null : timestamp;
}

export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatLocalDateTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${formatLocalDate(date)}T${hours}:${minutes}`;
}

export function formatCalendarDate(value: string): string {
  const date = parseLocalDateValue(value);
  return date ? formatLocalDate(date) : '';
}

export function formatLocalDateTimeInput(value: string): string {
  const date = parseLocalDateValue(value);
  return date ? formatLocalDateTime(date) : '';
}

export function localDateTimeToISOString(value: string): string | undefined {
  if (!value) return undefined;
  const date = parseLocalDateValue(value);
  return date?.toISOString();
}

export function formatDueDate(dateStr?: string): { text: string; isOverdue: boolean; isToday: boolean } {
  if (!dateStr) return { text: '', isOverdue: false, isToday: false };

  const target = parseLocalDateValue(dateStr);
  if (!target) return { text: '', isOverdue: false, isToday: false };
  const now = new Date();
  
  const isTodayDate =
    target.getDate() === now.getDate() &&
    target.getMonth() === now.getMonth() &&
    target.getFullYear() === now.getFullYear();

  const isOverdue = target.getTime() < now.getTime() && !isTodayDate;

  if (isTodayDate) {
    return { text: 'Today', isOverdue: false, isToday: true };
  }

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow =
    target.getDate() === tomorrow.getDate() &&
    target.getMonth() === tomorrow.getMonth() &&
    target.getFullYear() === tomorrow.getFullYear();

  if (isTomorrow) {
    return { text: 'Tomorrow', isOverdue: false, isToday: false };
  }

  const formatted = target.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

  return { text: formatted, isOverdue, isToday: false };
}

export function getPriorityBadge(priority: Priority): { label: string; className: string } {
  switch (priority) {
    case 'HIGH':
      return {
        label: 'High',
        className: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border-rose-200 dark:border-rose-900',
      };
    case 'MEDIUM':
      return {
        label: 'Medium',
        className: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200 dark:border-amber-900',
      };
    case 'LOW':
    default:
      return {
        label: 'Low',
        className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900',
      };
  }
}

export function getStatusBadge(status: TaskStatus): { label: string; className: string } {
  switch (status) {
    case 'COMPLETED':
      return {
        label: 'Completed',
        className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
      };
    case 'IN_PROGRESS':
      return {
        label: 'In Progress',
        className: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
      };
    case 'ON_HOLD':
      return {
        label: 'On Hold',
        className: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
      };
    case 'CANCELLED':
      return {
        label: 'Cancelled',
        className: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
      };
    case 'PENDING':
    default:
      return {
        label: 'Pending',
        className: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
      };
  }
}
