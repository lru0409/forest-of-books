'use client';

import { useState } from 'react';

import { BookOpen } from 'lucide-react';

import { Book } from './types';
import { MOCK_BOOKS } from './mockBooks';
import { Container } from '@/components/layout';
import { ViewToggle, ViewMode } from './_components/ViewToggle';
import { BookShelf } from './_components/BookShelf';
import { BookCardGrid } from './_components/BookCardGrid';

export default function NotesPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('shelf');

  return (
    <Container>
      <div className="flex h-full min-w-[400px] flex-col">
        <div className="mt-6 flex justify-center">
          <ViewToggle view={viewMode} onChange={setViewMode} />
        </div>
        <BooksView mode={viewMode} />
      </div>
    </Container>
  );
}

const BooksView = ({ mode }: { mode: ViewMode }) => {
  const books: Book[] = MOCK_BOOKS;

  if (books.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center">
        <BookOpen className="text-primary mb-5 size-18" strokeWidth={1.2} aria-hidden="true" />
        <p className="text-primary mb-1.5 text-lg font-semibold">책장이 비어있어요</p>
        <p className="text-secondary text-base font-semibold">
          책을 추가해 나만의 서재를 채워보세요.
        </p>
      </div>
    );
  }

  return (
    <div className="my-6">
      {mode === 'shelf' ? <BookShelf books={books} /> : <BookCardGrid books={books} />}
    </div>
  );
};
