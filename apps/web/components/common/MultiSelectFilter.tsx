'use client';

import { ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface Option {
  value: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface MultiSelectFilterProps {
  label: string;
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export function MultiSelectFilter({ label, options, selected, onChange }: MultiSelectFilterProps) {
  const isAllSelected = selected.length >= options.length;

  const toggle = (value: string) => {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="group border-primary/30 bg-primary/8 text-primary flex cursor-pointer items-center gap-1 rounded-full border px-2.5 py-1.5 text-xs font-medium md:gap-1.5 md:px-4 md:py-2 md:text-sm"
        >
          {label}
          <span className="bg-primary text-primary-foreground hidden h-5 min-w-4.5 items-center justify-center rounded-full px-1.5 text-[10px] md:flex">
            {isAllSelected ? '전체' : selected.length}
          </span>
          <ChevronDown
            className="text-primary size-3.5 transition-transform duration-200 group-data-[state=open]:rotate-180"
            aria-hidden="true"
          />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="rounded-2xl p-2">
        <div className="flex flex-col gap-1">
          {options.map(({ value, label: optionLabel, icon: Icon }) => {
            const checked = selected.includes(value);
            return (
              <label
                key={value}
                className={cn(
                  'flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 transition-colors',
                  checked ? 'bg-primary/8' : 'hover:bg-muted',
                )}
              >
                <Checkbox checked={checked} onCheckedChange={() => toggle(value)} />
                {Icon && <Icon className="text-secondary size-3.5" />}
                <span className={cn('text-primary text-sm', checked && 'font-medium')}>
                  {optionLabel}
                </span>
              </label>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
