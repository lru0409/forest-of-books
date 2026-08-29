import { ReadingStatusBadge, GenreBadge } from '@/components/common';
import { type LibraryEntryListItem } from '@/lib';

interface TooltipProps {
  item: LibraryEntryListItem;
}

export function Tooltip({ item }: TooltipProps) {
  const { title, author, genre, status } = item;
  return (
    <div className="flex w-56 flex-col gap-1 p-1">
      <p className="text-primary line-clamp-1 text-base font-semibold">{title}</p>
      <p className="text-secondary line-clamp-1 text-sm">{author}</p>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <GenreBadge genre={genre} />
        <ReadingStatusBadge status={status} />
      </div>
    </div>
  );
}
