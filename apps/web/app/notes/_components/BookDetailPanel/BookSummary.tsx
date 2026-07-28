import {
  cn,
  READING_STATUSES,
  READING_STATUS_LABELS,
  READING_STATUS_ICONS,
  READING_STATUS_STYLES,
  type Book,
  type ReadingStatus,
} from '@/lib';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GenreBadge } from '@/components/common';

interface BookSummaryProps {
  book: Book;
  color: string;
  status: ReadingStatus;
  onStatusChange: (status: ReadingStatus) => void;
}

export function BookSummary({ book, color, status, onStatusChange }: BookSummaryProps) {
  return (
    <div className="flex gap-4">
      <div className="h-28 w-20 rounded-sm shadow-sm" style={{ backgroundColor: color }} />
      <div className="flex-1 pt-1">
        <h2 className="text-primary font-heading line-clamp-2 text-xl font-semibold">
          {book.title}
        </h2>
        <p className="text-secondary mt-1 text-sm">{book.author}</p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <GenreBadge genre={book.genre} />
          <ReadingStatusSelect status={status} onChange={onStatusChange} />
        </div>
      </div>
    </div>
  );
}

export function ReadingStatusSelect({
  status,
  onChange,
}: {
  status: ReadingStatus;
  onChange: (status: ReadingStatus) => void;
}) {
  return (
    <Select value={status} onValueChange={(value) => onChange(value as ReadingStatus)}>
      <SelectTrigger
        aria-label="읽기 상태 변경"
        className={cn(
          'w-fit gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium',
          READING_STATUS_STYLES[status],
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="rounded-2xl p-2">
        <div className="flex flex-col gap-1.5">
          {READING_STATUSES.map((value) => {
            const Icon = READING_STATUS_ICONS[value];
            return (
              <SelectItem
                key={value}
                value={value}
                className={cn('rounded-full text-xs font-medium', READING_STATUS_STYLES[value])}
              >
                <span className="flex items-center gap-1 transition-transform duration-150 group-data-highlighted:scale-107">
                  <Icon className="size-3.5" aria-hidden="true" />
                  {READING_STATUS_LABELS[value]}
                </span>
              </SelectItem>
            );
          })}
        </div>
      </SelectContent>
    </Select>
  );
}
