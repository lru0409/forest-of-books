'use client';

import { Search, X } from 'lucide-react';

import { cn } from '@/lib/utils';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export function SearchInput({
  value,
  onChange,
  placeholder,
  className,
  autoFocus,
}: SearchInputProps) {
  return (
    <div
      className={cn(
        'bg-primary/8 border-primary/30 flex h-9.5 items-center gap-2 rounded-full border pr-3 pl-4',
        className,
      )}
    >
      <Search className="text-primary size-3.5" aria-hidden="true" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="placeholder:text-muted-foreground w-full flex-1 text-sm text-black outline-none"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-full bg-stone-400 text-white"
          aria-label="검색어 지우기"
        >
          <X className="size-2.5" strokeWidth={4} />
        </button>
      )}
    </div>
  );
}
