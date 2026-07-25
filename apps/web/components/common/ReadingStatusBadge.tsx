import {
  READING_STATUS_LABELS,
  READING_STATUS_ICONS,
  READING_STATUS_STYLES,
  type ReadingStatus,
} from '@/lib';

interface ReadingStatusBadgeProps {
  status: ReadingStatus;
}

export function ReadingStatusBadge({ status }: ReadingStatusBadgeProps) {
  const Icon = READING_STATUS_ICONS[status];

  return (
    <span
      className={`flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium ${READING_STATUS_STYLES[status]}`}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {READING_STATUS_LABELS[status]}
    </span>
  );
}
