import { ReadingStatusBadge, GenreBadge } from '@/components/common';
import { type BookWithNote } from '../../types';

interface TooltipProps {
  book: BookWithNote;
}

export function Tooltip({ book }: TooltipProps) {
  return (
    <div className="flex w-56 flex-col gap-1 p-1">
      <p className="text-primary line-clamp-1 text-base font-semibold">{book.title}</p>
      <p className="text-secondary line-clamp-1 text-sm">{book.author}</p>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <GenreBadge genre={book.genre} />
        <ReadingStatusBadge status={book.status} />
      </div>
    </div>
  );
}
