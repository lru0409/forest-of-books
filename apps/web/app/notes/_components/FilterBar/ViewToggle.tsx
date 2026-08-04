'use client';

import { LayoutGrid, Rows3 } from 'lucide-react';

import { cn } from '@/lib';
import { type ViewMode } from '../../types';

interface ViewToggleProps {
  view: ViewMode;
  onChange: (view: ViewMode) => void;
}

const OPTIONS: { value: ViewMode; label: string; icon: typeof Rows3 }[] = [
  { value: 'shelf', label: '책장', icon: Rows3 },
  { value: 'card', label: '카드', icon: LayoutGrid },
];

export function ViewToggle({ view, onChange }: ViewToggleProps) {
  const activeIndex = OPTIONS.findIndex((option) => option.value === view);

  return (
    <div
      role="tablist"
      aria-label="책 목록 보기 방식"
      className="border-primary/30 bg-primary/8 relative inline-grid rounded-full border p-0.5"
      style={{ gridTemplateColumns: `repeat(${OPTIONS.length}, minmax(0, 1fr))` }}
    >
      <div
        aria-hidden="true"
        className="bg-primary absolute inset-y-0.5 left-0.5 rounded-full transition-transform duration-300"
        style={{
          width: `calc((100% - 0.25rem) / ${OPTIONS.length})`,
          transform: `translateX(${activeIndex * 100}%)`,
        }}
      />
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const isActive = view === value;
        return (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(value)}
            className={cn(
              'group relative z-10 flex cursor-pointer items-center justify-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm font-medium transition-colors md:px-3.5',
              isActive ? 'text-primary-foreground' : 'text-primary',
            )}
          >
            <Icon
              className={cn(
                'size-3.5 transition-transform duration-200',
                !isActive && 'group-hover:scale-110',
              )}
              aria-hidden="true"
            />
            <span
              className={cn(
                'hidden transition-transform duration-200 md:inline',
                !isActive && 'group-hover:scale-110',
              )}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
