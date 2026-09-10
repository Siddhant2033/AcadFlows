// apps/web/src/lib/cn.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind classes safely — later classes win over conflicting earlier ones.
 *
 *   cn('px-2 py-1', 'px-4')  →  'py-1 px-4'
 *   cn('bg-red-500', isActive && 'bg-blue-500')
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}