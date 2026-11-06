import { LoaderCircle, type LucideProps } from 'lucide-react';

import { cn } from '@/lib/utils';

export function Spinner({ className, strokeWidth = 2, ...props }: LucideProps) {
  return (
    <LoaderCircle
      className={cn('animate-spin', className)}
      strokeWidth={strokeWidth}
      aria-hidden="true"
      {...props}
    />
  );
}
