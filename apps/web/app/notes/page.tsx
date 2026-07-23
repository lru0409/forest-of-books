'use client';

import { useMemo, useState } from 'react';

import { BookOpen } from 'lucide-react';

import { GENRES, READING_STATUSES, type Genre, type ReadingStatus, type Book } from '@/lib';
import { MOCK_BOOKS } from './mockBooks';
import { Container } from '@/components/layout';
import { type ViewMode } from './types';
import { BookShelf, BookCardGrid, FilterBar } from './_components';

export default function NotesPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('shelf');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<Genre[]>([...GENRES]);
  const [selectedStatuses, setSelectedStatuses] = useState<ReadingStatus[]>([...READING_STATUSES]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedGenres.length < GENRES.length ||
    selectedStatuses.length < READING_STATUSES.length;

  const filteredBooks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return MOCK_BOOKS.filter((book) => {
      const matchesQuery =
        query === '' ||
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query);
      const matchesGenre = selectedGenres.includes(book.genre);
      const matchesStatus = selectedStatuses.includes(book.status);
      return matchesQuery && matchesGenre && matchesStatus;
    });
  }, [searchQuery, selectedGenres, selectedStatuses]);

  return (
    <Container>
      <div className="flex h-full min-w-[400px] flex-col px-12 pt-8 pb-10">
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
  books: Book[];
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
