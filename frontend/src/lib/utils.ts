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
      return 'text-emerald-600 bg-emerald-50';
    case 'COMPLETED':
      return 'text-green-700 bg-green-50';
    case 'PAUSED':
      return 'text-amber-700 bg-amber-50';
    case 'FAILED':
    case 'STOPPED':
      return 'text-red-600 bg-red-50';
    case 'SCHEDULED':
      return 'text-violet-700 bg-violet-50';
    default:
      return 'text-muted-foreground bg-muted';
  }
}

export function getLogStatusColor(status: string): string {
  switch (status) {
    case 'SUCCESS':
      return 'text-emerald-700 bg-emerald-100';
    case 'FAILED':
      return 'text-red-700 bg-red-100';
    case 'RETRY':
      return 'text-amber-700 bg-amber-100';
    case 'SKIPPED':
      return 'text-gray-600 bg-gray-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}
