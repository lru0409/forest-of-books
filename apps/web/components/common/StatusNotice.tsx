import { type ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface StatusNoticeProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function StatusNotice({ icon, title, description, action, className }: StatusNoticeProps) {
  return (
    <div
      className={cn(
        'mx-auto flex w-100 flex-col items-center justify-center text-center',
        className,
      )}
    >
      {icon}
      <p className="text-primary mt-5 mb-1.5 text-lg font-semibold">{title}</p>
      {description && (
        <p className={cn('text-secondary text-base font-semibold', action && 'mb-3')}>
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
