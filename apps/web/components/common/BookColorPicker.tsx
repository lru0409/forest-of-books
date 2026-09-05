'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

import type { InputState } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib';
import { BookColorPalette } from './BookColorPalette';

interface BookColorPickerProps {
  value: string | null;
  onChange: (color: string) => void;
  onOpenChange?: (open: boolean) => void;
  id?: string;
  state?: InputState;
  disabled?: boolean;
  colors?: string[];
}

export function BookColorPicker({
  value,
  onChange,
  onOpenChange,
  id,
  state = 'default',
  disabled,
  colors,
}: BookColorPickerProps) {
  const [open, setOpen] = useState(false);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    onOpenChange?.(next);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          aria-label="색상 선택"
          disabled={disabled}
          className={cn(
            'flex h-8 w-full items-center justify-between gap-2 rounded-xl border bg-white px-4 py-6 text-base outline-none disabled:cursor-not-allowed disabled:opacity-50',
            state === 'error' ? 'border-destructive' : 'border-input',
          )}
        >
          <span className="flex items-center gap-2">
            {value && (
              <span
                className="size-5 shrink-0 rounded-full"
                style={{ backgroundColor: value }}
                aria-hidden="true"
              />
            )}
            <span className={cn(!value && 'text-muted-foreground')}>
              {value || '색상을 선택해주세요.'}
            </span>
          </span>
          <ChevronDown
            className={cn(
              'size-4 shrink-0 text-current transition-transform duration-200',
              open && 'rotate-180',
            )}
            aria-hidden="true"
          />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto rounded-2xl p-3">
        <BookColorPalette
          value={value}
          colors={colors}
          onChange={(c) => {
            onChange(c);
            handleOpenChange(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
