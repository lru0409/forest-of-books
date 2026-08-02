'use client';

import { useEffect, useState } from 'react';

const TAILWIND_BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

type TailwindBreakpoint = keyof typeof TAILWIND_BREAKPOINTS;

function isTailwindBreakpoint(query: string): query is TailwindBreakpoint {
  return query in TAILWIND_BREAKPOINTS;
}

export function useMediaQuery(query: TailwindBreakpoint | string): boolean {
  const [matches, setMatches] = useState(false);

  const mediaQueryString = isTailwindBreakpoint(query)
    ? `(min-width: ${TAILWIND_BREAKPOINTS[query]}px)`
    : query;

  useEffect(() => {
    const mediaQueryList = window.matchMedia(mediaQueryString);
    setMatches(mediaQueryList.matches);

    const handleChange = (event: MediaQueryListEvent) => setMatches(event.matches);
    mediaQueryList.addEventListener('change', handleChange);
    return () => mediaQueryList.removeEventListener('change', handleChange);
  }, [mediaQueryString]);

  return matches;
}
