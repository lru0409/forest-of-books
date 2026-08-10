'use client';

import { type ComponentType } from 'react';

import { cn } from '@/lib/utils';

export interface SegmentedToggleOption<T extends string> {
  value: T;
  label: string;
  icon?: ComponentType<{ className?: string }>;
}

interface SegmentedToggleProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: SegmentedToggleOption<T>[];
  ariaLabel: string;
  fullWidth?: boolean;
  size?: 'sm' | 'md';
}

export function SegmentedToggle<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  fullWidth = false,
  size = 'md',
}: SegmentedToggleProps<T>) {
  const activeIndex = options.findIndex((option) => option.value === value);

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        'border-primary/30 bg-primary/8 relative rounded-full border p-0.5',
        fullWidth ? 'grid' : 'inline-grid',
      )}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      <div
        aria-hidden="true"
        className="bg-primary absolute inset-y-0.5 left-0.5 rounded-full transition-transform duration-300"
        style={{
          width: `calc((100% - 0.25rem) / ${options.length})`,
          transform: `translateX(${activeIndex * 100}%)`,
        }}
      />
      {options.map(({ value: optionValue, label, icon: Icon }) => {
        const isActive = value === optionValue;
        return (
          <button
            key={optionValue}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(optionValue)}
            className={cn(
              'group relative z-10 flex cursor-pointer items-center justify-center rounded-full px-2.5 py-1.5 font-medium transition-colors',
              size === 'sm' ? 'gap-1 text-xs' : 'gap-1.5 text-sm md:px-3.5',
              isActive ? 'text-primary-foreground' : 'text-primary',
            )}
          >
            {Icon && (
              <Icon
                className={cn(
                  'size-3.5 transition-transform duration-200',
                  !isActive && 'group-hover:scale-110',
                )}
              />
            )}
            <span
              className={cn(
                'transition-transform duration-200',
                Icon && 'hidden md:inline',
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
