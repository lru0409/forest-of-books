'use client';

import { useEffect, useRef, useState } from 'react';

import { Book } from '../../types';
import { Item } from './Item';

interface BookShelfProps {
  books: Book[];
}

const BOOK_WIDTH = 48;
const BOOK_GAP = 6;
const ROW_PADDING_X = 32; // 한 줄의 실제 padding (양쪽 합, 각 16px)
const MIN_SIDE_MARGIN_X = 40; // 선반 양쪽에 최소로 남기고 싶은 여백 (양쪽 합, 각 20px)
const DEFAULT_BOOKS_PER_SHELF = 10;

export function BookShelf({ books }: BookShelfProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [booksPerShelf, setBooksPerShelf] = useState(DEFAULT_BOOKS_PER_SHELF);
  const [firstBookOffset, setFirstBookOffset] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateLayout = () => {
      const contentWidth = container.clientWidth - ROW_PADDING_X - MIN_SIDE_MARGIN_X;
      const count = Math.max(1, Math.floor((contentWidth + BOOK_GAP) / (BOOK_WIDTH + BOOK_GAP)));
      const booksWidth = count * BOOK_WIDTH + (count - 1) * BOOK_GAP;
      const extraSlack = Math.max(0, contentWidth - booksWidth);

      setBooksPerShelf(count);
      setFirstBookOffset(MIN_SIDE_MARGIN_X / 2 + extraSlack / 2);
    };

    updateLayout();

    const observer = new ResizeObserver(updateLayout);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const shelves: Book[][] = [];
  for (let i = 0; i < books.length; i += booksPerShelf) {
    shelves.push(books.slice(i, i + booksPerShelf));
  }

  return (
    <div ref={containerRef} className="flex flex-col gap-6">
      {shelves.map((shelfBooks, shelfIndex) => (
        <div
          key={shelfIndex}
          className="animate-emerge flex flex-col px-4"
          style={{ animationDelay: `${shelfIndex * 100}ms` }}
        >
          {/* 책들 */}
          <div className="z-1 -mb-2 flex gap-1.5" style={{ marginLeft: firstBookOffset }}>
            {shelfBooks.map((book) => (
              <Item key={book.id} book={book} />
            ))}
          </div>

          {/* 선반 */}
          <div className="h-4 rounded-t-sm bg-yellow-800/50 shadow-md" />
          <div className="h-2 rounded-b-sm bg-yellow-900/55" />
        </div>
      ))}
    </div>
  );
}
