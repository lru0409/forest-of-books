'use client';

import { LayoutGrid, Rows3 } from 'lucide-react';

import { cn } from '@/lib';

export type ViewMode = 'shelf' | 'card';

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
      className="bg-primary relative inline-grid rounded-full p-1.5"
      style={{ gridTemplateColumns: `repeat(${OPTIONS.length}, minmax(0, 1fr))` }}
    >
      <div
        aria-hidden="true"
        className="bg-primary-foreground absolute inset-y-1.5 left-1.5 rounded-full transition-transform duration-300"
        style={{
          width: `calc((100% - 0.75rem) / ${OPTIONS.length})`,
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
              'text-md relative z-10 flex items-center justify-center gap-1.5 rounded-full px-5 py-1.5 font-medium transition-transform duration-200',
              isActive ? 'text-primary' : 'text-primary-foreground hover:scale-110',
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
