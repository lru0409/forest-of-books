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

export function matchRoute(pathname: string, pattern: string) {
  const pathnameSegments = pathname.split('/');
  const patternSegments = pattern.split('/');
  const hasTrailingWildcard = patternSegments.at(-1) === '*';

  const isLengthMatched = hasTrailingWildcard
    ? pathnameSegments.length >= patternSegments.length
    : pathnameSegments.length === patternSegments.length;
  if (!isLengthMatched) return false;

  return patternSegments.every((segment, i) =>
    segment === '*' ? pathnameSegments[i] !== '' : segment === pathnameSegments[i],
  );
}
