import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import {
  GENRES,
  READING_STATUSES,
  parseFilterParam,
  useDebounce,
  type Genre,
  type ReadingStatus,
  type LibraryEntryListItem,
} from '@/lib';

function useLibraryFilters(items: LibraryEntryListItem[]) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();

  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') ?? '');
  const debouncedSearchQuery = useDebounce(searchQuery);

  const selectedGenres = useMemo(
    () => parseFilterParam(searchParams.get('genres'), GENRES),
    [searchParams],
  );
  const selectedStatuses = useMemo(
    () => parseFilterParam(searchParams.get('statuses'), READING_STATUSES),
    [searchParams],
  );

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParamsString);
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [searchParamsString, pathname, router],
  );

  useEffect(() => {
    updateParams({ q: debouncedSearchQuery || null });
  }, [debouncedSearchQuery, updateParams]);

  const setSelectedGenres = useCallback(
    (genres: Genre[]) => {
      updateParams({ genres: genres.length < GENRES.length ? genres.join(',') : null });
    },
    [updateParams],
  );

  const setSelectedStatuses = useCallback(
    (statuses: ReadingStatus[]) => {
      updateParams({ statuses: statuses.length < READING_STATUSES.length ? statuses.join(',') : null });
    },
    [updateParams],
  );

  const filteredItems = useMemo(() => {
    const query = debouncedSearchQuery.trim().toLowerCase();
    return items.filter(({ title, author, genre, status }) => {
      const matchesQuery =
        query === '' || title.toLowerCase().includes(query) || author.toLowerCase().includes(query);
      const matchesGenre = selectedGenres.includes(genre);
      const matchesStatus = selectedStatuses.includes(status);
      return matchesQuery && matchesGenre && matchesStatus;
    });
  }, [items, debouncedSearchQuery, selectedGenres, selectedStatuses]);

  return {
    searchQuery,
    setSearchQuery,
    selectedGenres,
    setSelectedGenres,
    selectedStatuses,
    setSelectedStatuses,
    filteredItems,
  };
}

export default useLibraryFilters;
