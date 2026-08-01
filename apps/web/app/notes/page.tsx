'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { BookOpen } from 'lucide-react';

import {
  GENRES,
  READING_STATUSES,
  useDebounce,
  type Genre,
  type ReadingStatus,
  type Book,
  type ReadingNote,
} from '@/lib';
import { MOCK_BOOKS, MOCK_READING_NOTES } from './mockBooks';
import { Container } from '@/components/layout';
import { type ViewMode, type BookWithNote } from './types';
import {
  BookShelf,
  BookCardGrid,
  FilterBar,
  BookDetailAside,
  PANEL_TRANSITION_MS,
} from './_components';

const books = MOCK_BOOKS;

export default function NotesPage() {
  const searchParams = useSearchParams();
  const selectedBookId = searchParams.get('book');

  const [viewMode, setViewMode] = useState<ViewMode>('shelf');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<Genre[]>([...GENRES]);
  const [selectedStatuses, setSelectedStatuses] = useState<ReadingStatus[]>([...READING_STATUSES]);
  const [notes, setNotes] = useState<Record<string, ReadingNote>>(MOCK_READING_NOTES);

  const [displayedBook, setDisplayedBook] = useState<Book | undefined>(undefined);
  const [isClosing, setIsClosing] = useState(false);
  const [isEntering, setIsEntering] = useState(false);
  const wasOpenRef = useRef(false);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedGenres.length < GENRES.length ||
    selectedStatuses.length < READING_STATUSES.length;

  const debouncedSearchQuery = useDebounce(searchQuery);

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
  }, [notes, debouncedSearchQuery, selectedGenres, selectedStatuses]);

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
  }, [selectedBookId]);

  const handleUpdateNote = (bookId: string, patch: Partial<ReadingNote>) => {
    setNotes((current) => ({ ...current, [bookId]: { ...current[bookId]!, ...patch } }));
  };

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
      <div className="flex h-full flex-col px-4 pt-8 md:min-w-[400px] md:px-12">
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
        <div className="mt-8">
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
      <div className="flex flex-1 flex-col items-center justify-center">
        <BookOpen className="text-primary mb-5 size-18" strokeWidth={1.2} aria-hidden="true" />
        <p className="text-primary mb-1.5 text-lg font-semibold">
          {isFiltered ? '조건에 맞는 책이 없어요' : '책장이 비어있어요'}
        </p>
        <p className="text-secondary text-base font-semibold">
          {isFiltered
            ? '검색어나 필터 조건을 바꿔보세요.'
            : '책을 추가해 나만의 서재를 채워보세요.'}
        </p>
      </div>
    );
  }

  return mode === 'shelf' ? <BookShelf books={books} /> : <BookCardGrid books={books} />;
};
