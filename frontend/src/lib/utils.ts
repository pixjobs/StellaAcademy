import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * A utility function to combine and merge Tailwind CSS classes.
 * It intelligently handles conditional classes and resolves style conflicts.
 *
 * @param inputs - A list of class values (strings, objects, arrays).
 * @returns A single string of final, merged class names.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}