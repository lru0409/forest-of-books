import type { ReactNode } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

import { cn } from '@/lib';

export function SettingsMenu({ children }: { children: ReactNode }) {
  return (
    <div className="border-border/15 divide-border/15 divide-y overflow-hidden rounded-2xl border bg-white">
      {children}
    </div>
  );
}

interface SettingsMenuItemProps {
  title: string;
  description?: string;
  tone?: 'default' | 'destructive';
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export function SettingsMenuItem({
  title,
  description,
  tone = 'default',
  href,
  onClick,
  disabled = false,
}: SettingsMenuItemProps) {
  const className = cn(
    'block w-full px-4 py-3.5 text-left transition-colors',
    disabled ? 'cursor-not-allowed' : 'hover:bg-primary/5 cursor-pointer',
  );
  const content: ReactNode = (
    <span className={cn('flex items-center justify-between gap-4', disabled && 'opacity-50')}>
      <span className="min-w-0">
        <span
          className={cn('block text-sm font-medium', tone === 'destructive' && 'text-destructive')}
        >
          {title}
        </span>
        {description && <span className="text-secondary mt-0.5 block text-xs">{description}</span>}
      </span>
      {href && <ChevronRight className="text-secondary size-4 shrink-0" aria-hidden="true" />}
    </span>
  );

  if (href && !disabled) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" className={className} onClick={onClick} disabled={disabled}>
      {content}
    </button>
  );
}
