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

export function formatRatingLabel(value: number) {
  return value % 1 === 0 ? String(value) : value.toFixed(1);
}

// TODO: wild card가 중간에 들어오는 케이스도 고려 필요
export function matchRoute(pathname: string, path: string) {
  if (path.endsWith('/*')) return pathname.startsWith(path.slice(0, -1));
  return pathname === path;
}
