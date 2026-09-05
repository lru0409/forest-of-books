import { useState } from 'react';

import { BOOK_COLORS, type Book } from '@/lib';

// TODO color 관련 수정 필요
// TODO /notes/page에서 활용

export function BookCover({ book, index }: { book: Book; index: number }) {
  const [imageFailed, setImageFailed] = useState(false);

  if (book.coverUrl && !imageFailed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={book.coverUrl}
        alt={book.title}
        className="h-21 w-14 rounded-sm object-cover shadow-sm"
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <div
      className="flex h-21 w-14 rounded-sm shadow-sm"
      style={{ backgroundColor: BOOK_COLORS[index % BOOK_COLORS.length] }}
    />
  );
}
