import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseFilterParam<T extends string>(
  value: string | null,
  validValues: readonly T[],
): T[] {
  if (!value) return [...validValues];

  const values = value.split(',').filter((item): item is T => validValues.includes(item as T));

  return values.length > 0 ? values : [...validValues];
}
