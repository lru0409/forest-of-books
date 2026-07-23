import { READING_STATUS_LABELS, READING_STATUS_ICONS, type ReadingStatus } from '@/lib';

const STATUS_CLASSNAMES: Record<ReadingStatus, string> = {
  NOT_STARTED: 'border border-primary/15 bg-muted text-foreground',
  READING: 'border border-transparent bg-secondary text-white',
  COMPLETED: 'border border-transparent bg-primary text-primary-foreground',
  ON_HOLD: 'border border-dashed border-secondary bg-transparent text-primary',
};

interface ReadingStatusBadgeProps {
  status: ReadingStatus;
}

export function ReadingStatusBadge({ status }: ReadingStatusBadgeProps) {
  const Icon = READING_STATUS_ICONS[status];

  return (
    <span
      className={`flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium ${STATUS_CLASSNAMES[status]}`}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {READING_STATUS_LABELS[status]}
    </span>
  );
}
