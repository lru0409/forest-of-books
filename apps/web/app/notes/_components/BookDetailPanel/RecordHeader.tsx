import { Check, Pencil } from 'lucide-react';

import { formatDate } from '@/lib';

interface RecordHeaderProps {
  createdAt: string | undefined;
  updatedAt: string | undefined;
  isEditing: boolean;
  onToggleEdit: () => void;
}

export function RecordHeader({ createdAt, updatedAt, isEditing, onToggleEdit }: RecordHeaderProps) {
  const dateLabel = (() => {
    if (!createdAt) return null;
    if (!updatedAt || updatedAt === createdAt) {
      return `${formatDate(createdAt)} 생성`;
    }
    return `${formatDate(createdAt)} 생성 · ${formatDate(updatedAt)} 수정`;
  })();

  return (
    <div className="mb-2 flex items-start justify-between">
      <div>
        <h3 className="text-primary font-heading text-xl font-semibold">기록</h3>
        <p className="text-secondary mt-0.5 mb-2 text-sm">{dateLabel}</p>
      </div>
      <button
        type="button"
        aria-label={isEditing ? '기록 저장' : '기록 수정'}
        onClick={onToggleEdit}
        className="hover:bg-primary-foreground/50 flex size-9 cursor-pointer items-center justify-center rounded-full transition-colors"
      >
        {isEditing ? (
          <Check className="size-4.5" aria-hidden="true" />
        ) : (
          <Pencil className="size-4.5" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
