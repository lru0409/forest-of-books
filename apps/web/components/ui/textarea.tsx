import * as React from 'react';

import { cn } from '@/lib/utils';

// TODO: 글자 수 카운트 기능
function Textarea({ className, maxLength = 255, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'border-input placeholder:text-muted-foreground focus-visible:border-primary disabled:bg-input/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 flex field-sizing-content min-h-16 w-full rounded-xl border bg-white px-4 pt-3 pb-3.5 text-base transition-colors outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-3',
        className,
      )}
      maxLength={maxLength}
      {...props}
    />
  );
}

export { Textarea };
