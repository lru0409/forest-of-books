'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { ReadingStatusBadge, GenreBadge } from '@/components/common';
import { type BookWithNote } from '../../types';

interface ItemProps {
  book: BookWithNote;
  index?: number;
}

export function Item({ book, index = 0 }: ItemProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleClick = () => {
    const navigate = searchParams.has('book') ? router.replace : router.push;
    const params = new URLSearchParams(searchParams);
    params.set('book', book.id);
    navigate(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div
      onClick={handleClick}
      className="animate-emerge border-primary/15 flex cursor-pointer overflow-hidden rounded-lg border bg-white shadow-sm transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-lg"
      style={{ animationDelay: `${Math.min(index, 20) * 40}ms` }}
      title={`${book.title} — ${book.author}`}
    >
      <div className="w-1.5" style={{ backgroundColor: book.color }} />
      <div className="flex flex-1 gap-3 p-4">
        <div className="flex flex-1 flex-col gap-1">
          <h3 className="text-primary text-base font-semibold">{book.title}</h3>
          <p className="text-secondary text-sm">{book.author}</p>

          <div className="mt-auto flex items-center gap-1.5">
            <GenreBadge genre={book.genre} />
            <ReadingStatusBadge status={book.status} />
          </div>
        </div>

        {/* 표지 자리 */}
        <div
          className="-my-1 -mr-1 h-30 w-20 rounded-sm shadow-sm"
          style={{ backgroundColor: book.color }}
        />
      </div>
    </div>
  );
}
