/**
 * utils.ts
 * ---------------------------------------------------------------------------
 * The canonical `cn()` helper used by every shadcn/ui component. Combines
 * clsx (conditional className composition) with tailwind-merge (deduplicates
 * conflicting Tailwind classes, e.g. `px-2 px-4` → `px-4`).
 *
 * Used throughout the app for className composition.
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
