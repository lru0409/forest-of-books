'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { BookOpen } from 'lucide-react';

import {
  GENRES,
  READING_STATUSES,
  useDebounce,
  useLocalStorage,
  type Genre,
  type ReadingStatus,
  type ReadingNote,
  type LibraryEntryListItem,
} from '@/lib';
import { Container } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { StatusNotice } from '@/components/common';
import { useAuthStore } from '@/store/authStore';
import LibraryService from '@/services/library';
import { type ViewMode, type BookWithNote } from './types';
import {
  BookShelf,
  BookCardGrid,
  FilterBar,
  BookDetailAside,
  PANEL_TRANSITION_MS,
} from './_components';

function parseFilterParam<T extends string>(value: string | null, validValues: readonly T[]): T[] {
  if (!value) return [...validValues];
  const values = value.split(',').filter((item): item is T => validValues.includes(item as T));
  return values.length > 0 ? values : [...validValues];
}

export default function NotesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const selectedBookId = searchParams.get('book');

  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  const [viewMode, setViewMode] = useLocalStorage<ViewMode>('notes-view-mode', 'shelf');
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') ?? '');
  const [selectedGenres, setSelectedGenres] = useState<Genre[]>(() =>
    parseFilterParam(searchParams.get('genres'), GENRES),
  );
  const [selectedStatuses, setSelectedStatuses] = useState<ReadingStatus[]>(() =>
    parseFilterParam(searchParams.get('statuses'), READING_STATUSES),
  );

  const [books, setBooks] = useState<BookWithNote[]>([]);
  const [notes, setNotes] = useState<Record<string, ReadingNote>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  const [displayedBook, setDisplayedBook] = useState<BookWithNote | undefined>(undefined);
  const [isClosing, setIsClosing] = useState(false);
  const [isEntering, setIsEntering] = useState(false);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (!user || !token) return;

    setIsLoading(true);
    setError(false);
    LibraryService.getUserLibrary(user.id, token).then((result) => {
      if (result.isSuccess) {
        const entries: LibraryEntryListItem[] = result.data;
        setBooks(entries.map((entry) => ({ ...entry, coverUrl: entry.coverUrl ?? undefined })));
        setNotes(
          Object.fromEntries(
            entries.map((entry) => [
              entry.id,
              { status: entry.status, color: entry.color, isPublic: entry.isPublic },
            ]),
          ),
        );
      } else {
        setError(true);
      }
      setIsLoading(false);
    });
  }, [user, token]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedGenres.length < GENRES.length ||
    selectedStatuses.length < READING_STATUSES.length;

  const debouncedSearchQuery = useDebounce(searchQuery);

  useEffect(() => {
    const params = new URLSearchParams(searchParamsString);

    if (debouncedSearchQuery) {
      params.set('q', debouncedSearchQuery);
    } else {
      params.delete('q');
    }

    if (selectedGenres.length < GENRES.length) {
      params.set('genres', selectedGenres.join(','));
    } else {
      params.delete('genres');
    }

    if (selectedStatuses.length < READING_STATUSES.length) {
      params.set('statuses', selectedStatuses.join(','));
    } else {
      params.delete('statuses');
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [
    debouncedSearchQuery,
    selectedGenres,
    selectedStatuses,
    pathname,
    router,
    searchParamsString,
  ]);

  const filteredBooks = useMemo(() => {
    const query = debouncedSearchQuery.trim().toLowerCase();
    return books
      .map((book): BookWithNote => ({ ...book, ...notes[book.id]! }))
      .filter((book) => {
        const matchesQuery =
          query === '' ||
          book.title.toLowerCase().includes(query) ||
          book.author.toLowerCase().includes(query);
        const matchesGenre = selectedGenres.includes(book.genre);
        const matchesStatus = selectedStatuses.includes(book.status);
        return matchesQuery && matchesGenre && matchesStatus;
      });
  }, [books, notes, debouncedSearchQuery, selectedGenres, selectedStatuses]);

  useEffect(() => {
    const selectedBook = selectedBookId ? books.find((book) => book.id === selectedBookId) : null;
    if (selectedBook) {
      const isNewlyOpening = !wasOpenRef.current;
      setDisplayedBook(selectedBook);
      setIsClosing(false);
      wasOpenRef.current = true;

      if (isNewlyOpening) {
        setIsEntering(true);
        const timer = setTimeout(() => setIsEntering(false), 20);
        return () => clearTimeout(timer);
      }
    } else if (wasOpenRef.current) {
      wasOpenRef.current = false;
      setIsClosing(true);
      const timer = setTimeout(() => setDisplayedBook(undefined), PANEL_TRANSITION_MS);
      return () => clearTimeout(timer);
    }
  }, [selectedBookId, books]);

  const handleUpdateNote = (bookId: string, patch: Partial<ReadingNote>) => {
    setNotes((current) => ({ ...current, [bookId]: { ...current[bookId]!, ...patch } }));
  };

  if (!token) {
    return (
      <Container>
        <StatusNotice
          className="h-full"
          icon={<BookOpen className="text-primary size-18" strokeWidth={1.2} aria-hidden="true" />}
          title="로그인이 필요해요"
          description="로그인하고 나만의 서재를 확인해보세요."
          action={
            <Button className="mt-6 w-full" onClick={() => router.push('/signin')}>
              로그인하러 가기
            </Button>
          }
        />
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <StatusNotice
          className="h-full"
          icon={<BookOpen className="text-primary size-18" strokeWidth={1.2} aria-hidden="true" />}
          title="서재를 불러오지 못했어요"
          description="잠시 후 다시 시도해주세요."
        />
      </Container>
    );
  }

  if (!user || isLoading) {
    return (
      <Container>
        <StatusNotice
          className="h-full"
          icon={<BookOpen className="text-primary size-18" strokeWidth={1.2} aria-hidden="true" />}
          title="서재를 불러오는 중이에요"
          description="잠시만 기다려주세요."
        />
      </Container>
    );
  }

  return (
    <Container
      aside={
        displayedBook && (
          <BookDetailAside
            book={displayedBook}
            note={notes[displayedBook.id]}
            onUpdateNote={(patch) => handleUpdateNote(displayedBook.id, patch)}
            isClosing={isClosing}
            isEntering={isEntering}
          />
        )
      }
    >
      <div className="flex h-full flex-col md:min-w-[400px]">
        <FilterBar
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          selectedGenres={selectedGenres}
          onSelectedGenresChange={setSelectedGenres}
          selectedStatuses={selectedStatuses}
          onSelectedStatusesChange={setSelectedStatuses}
          view={viewMode}
          onViewChange={setViewMode}
        />
        <div className="mt-6 flex flex-1 flex-col md:mt-8">
          <BooksView mode={viewMode} books={filteredBooks} isFiltered={hasActiveFilters} />
        </div>
      </div>
    </Container>
  );
}

const BooksView = ({
  mode,
  books,
  isFiltered,
}: {
  mode: ViewMode;
  books: BookWithNote[];
  isFiltered: boolean;
}) => {
  if (books.length === 0) {
    return (
      <StatusNotice
        className="flex-1"
        icon={<BookOpen className="text-primary size-18" strokeWidth={1.2} aria-hidden="true" />}
        title={isFiltered ? '조건에 맞는 책이 없어요' : '책장이 비어있어요'}
        description={
          isFiltered ? '검색어나 필터 조건을 바꿔보세요.' : '책을 추가해 나만의 서재를 채워보세요.'
        }
      />
    );
  }

  return mode === 'shelf' ? <BookShelf books={books} /> : <BookCardGrid books={books} />;
};
