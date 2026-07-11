'use client';

import { useState } from 'react';

import { BookOpen } from 'lucide-react';

import { Container } from '@/components/layout';
import { ViewToggle, ViewMode } from './_components/ViewToggle';
import { Book, MOCK_BOOKS } from './mockBooks';

export default function NotesPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('shelf');

  return (
    <Container>
      <div className="flex h-full min-w-[400px] flex-col">
        <div className="flex justify-center px-4 pt-4">
          <ViewToggle view={viewMode} onChange={setViewMode} />
        </div>
        <BooksView mode={viewMode} />
      </div>
    </Container>
  );
}

const BooksView = ({ mode }: { mode: ViewMode }) => {
  const books: Book[] = [];

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

  return null;
};
