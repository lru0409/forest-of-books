import { Book } from '../../types';
import { STATUS_CONFIG } from '../BookCardGrid/Item';

interface TooltipProps {
  book: Book;
}

export function Tooltip({ book }: TooltipProps) {
  const status = STATUS_CONFIG[book.status];
  const StatusIcon = status.icon;

  return (
    <div className="flex w-56 flex-col gap-1">
      <p className="text-primary line-clamp-1 text-sm font-semibold">{book.title}</p>
      <p className="text-secondary line-clamp-1 text-xs">{book.author}</p>

      <div className="mt-1 flex flex-wrap items-center gap-1">
        <span className="border-primary/15 bg-primary-foreground text-primary rounded-full border px-2 py-0.5 text-[11px]">
          {book.genre}
        </span>
        <span
          className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${status.className}`}
        >
          <StatusIcon className="size-3" aria-hidden="true" />
          {status.label}
        </span>
      </div>
    </div>
  );
}
