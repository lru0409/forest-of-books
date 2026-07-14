import { Circle, CheckCircle2, PauseCircle, PlayCircle } from 'lucide-react';

import { Book } from '../../types';

interface ItemProps {
  book: Book;
  index?: number;
}

export const STATUS_CONFIG: Record<
  Book['status'],
  { label: string; icon: typeof Circle; className: string }
> = {
  not_started: {
    label: '읽지 않음',
    icon: Circle,
    className: 'border border-primary/15 bg-muted text-foreground',
  },
  reading: {
    label: '읽는 중',
    icon: PlayCircle,
    className: 'border border-transparent bg-secondary text-white',
  },
  completed: {
    label: '완독',
    icon: CheckCircle2,
    className: 'border border-transparent bg-primary text-primary-foreground',
  },
  on_hold: {
    label: '보류',
    icon: PauseCircle,
    className: 'border border-dashed border-secondary bg-transparent text-primary',
  },
};

export function Item({ book, index = 0 }: ItemProps) {
  const status = STATUS_CONFIG[book.status];
  const StatusIcon = status.icon;

  return (
    <div
      className="animate-emerge border-primary/15 flex overflow-hidden rounded-lg border bg-white shadow-sm transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-lg"
      style={{ animationDelay: `${Math.min(index, 20) * 40}ms` }}
      title={`${book.title} — ${book.author}`}
    >
      <div className="w-1.5" style={{ backgroundColor: book.color }} />
      <div className="flex flex-1 gap-3 p-4">
        <div className="flex flex-1 flex-col gap-1">
          <h3 className="text-primary text-base font-semibold">{book.title}</h3>
          <p className="text-secondary text-sm">{book.author}</p>

          <div className="mt-auto flex items-center gap-1.5">
            <div className="border-primary/15 bg-primary-foreground text-primary rounded-full border px-3 py-1.5 text-xs">
              {book.genre}
            </div>

            <div
              className={`flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium ${status.className}`}
            >
              <StatusIcon className="size-3.5" aria-hidden="true" />
              {status.label}
            </div>
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
