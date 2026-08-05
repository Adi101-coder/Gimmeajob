import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleString();
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'RUNNING':
      return 'text-blue-400';
    case 'COMPLETED':
      return 'text-green-400';
    case 'PAUSED':
      return 'text-yellow-400';
    case 'FAILED':
    case 'STOPPED':
      return 'text-red-400';
    case 'SCHEDULED':
      return 'text-purple-400';
    default:
      return 'text-muted-foreground';
  }
}

export function getLogStatusColor(status: string): string {
  switch (status) {
    case 'SUCCESS':
      return 'text-green-400 bg-green-400/10';
    case 'FAILED':
      return 'text-red-400 bg-red-400/10';
    case 'RETRY':
      return 'text-yellow-400 bg-yellow-400/10';
    case 'SKIPPED':
      return 'text-muted-foreground bg-muted';
    default:
      return 'text-muted-foreground';
  }
}
