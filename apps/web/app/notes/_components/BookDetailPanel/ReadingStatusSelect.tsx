import {
  cn,
  READING_STATUSES,
  READING_STATUS_LABELS,
  READING_STATUS_ICONS,
  READING_STATUS_STYLES,
  type ReadingStatus,
} from '@/lib';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ReadingStatusSelectProps {
  status: ReadingStatus;
  onChange: (status: ReadingStatus) => void;
}

export function ReadingStatusSelect({ status, onChange }: ReadingStatusSelectProps) {
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
