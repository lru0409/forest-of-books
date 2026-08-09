'use client';

import { useMemo, useState } from 'react';
import { BookOpen } from 'lucide-react';

import { SearchInput } from '@/components/common';
import { Button } from '@/components/ui';
import { BOOK_COLORS, useDebounce, type Book } from '@/lib';
import { CATALOG } from '../../mockCatalog';

interface SearchTabProps {
  existingBooks: Book[];
  onAdd: (book: Book) => void;
  onGoToManual: () => void;
}

export function SearchTab({ existingBooks, onAdd, onGoToManual }: SearchTabProps) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query);
  const isSearching = debouncedQuery.trim() !== '';

  const results = useMemo(() => {
    if (!isSearching) return [];

    const normalizedQuery = debouncedQuery.trim().toLowerCase();
    if (normalizedQuery === '') return [];

    const filtered = CATALOG.filter(
      (book) =>
        book.title.toLowerCase().includes(normalizedQuery) ||
        book.author.toLowerCase().includes(normalizedQuery),
    ).filter((book) => !existingBooks.some((existing) => existing.id === book.id));

    return filtered;
  }, [isSearching, debouncedQuery, existingBooks]);

  const suggestions = useMemo(
    () =>
      CATALOG.filter((book) => !existingBooks.some((existing) => existing.id === book.id)).slice(),
    [existingBooks],
  );

  const listedBooks = isSearching ? results : suggestions;

  return (
    <div className="flex flex-1 flex-col gap-4">
      <SearchInput
        autoFocus
        value={query}
        onChange={setQuery}
        placeholder="제목 또는 저자로 검색하세요."
      />
      <div className="flex flex-1 flex-col">
        {!isSearching && (
          <p className="text-secondary px-2 pt-1 pb-2 text-sm font-medium">이런 책은 어때요?</p>
        )}
        {isSearching && results.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center">
            <BookOpen className="text-primary mb-5 size-18" strokeWidth={1.2} aria-hidden="true" />
            <p className="text-primary mb-3 text-center text-base font-medium">
              검색 결과가 없어요.
              <br />
              직접 입력해서 등록해주세요
            </p>
            <Button variant="outline" size="xs" onClick={onGoToManual}>
              직접 입력하기
            </Button>
          </div>
        )}
        <div className="flex flex-col gap-1">
          {listedBooks.map((book, index) => (
            <button
              key={book.id}
              type="button"
              onClick={() => onAdd(book)}
              className="hover:bg-primary/8 flex w-full cursor-pointer items-center gap-4 rounded-lg p-2 text-left transition-colors"
            >
              <div
                className="flex h-21 w-14 rounded-sm shadow-sm"
                style={{ backgroundColor: BOOK_COLORS[index % BOOK_COLORS.length] }}
              />
              <div className="flex flex-1 flex-col gap-1">
                <span className="text-base font-semibold">{book.title}</span>
                <span className="text-secondary text-sm">
                  {book.author}
                  {book.publisher ? ` | ${book.publisher}` : ''}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
