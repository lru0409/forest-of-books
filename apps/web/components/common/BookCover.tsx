import { useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { BookOpen } from 'lucide-react';

import { cn } from '@/lib/utils';

const bookCoverSize = cva('', {
  variants: {
    size: {
      default: 'h-21 w-14',
      lg: 'h-30 w-20',
    },
  },
  defaultVariants: {
    size: 'default',
  },
});

const iconSizeBySize: Record<NonNullable<VariantProps<typeof bookCoverSize>['size']>, string> = {
  default: 'size-6',
  lg: 'size-8',
};

interface BookCoverProps extends VariantProps<typeof bookCoverSize> {
  coverUrl: string | null;
  title?: string;
  color?: string;
  className?: string;
}

export function BookCover({ coverUrl, title, color, size = 'default', className }: BookCoverProps) {
  const [imageFailed, setImageFailed] = useState(false);

  if (coverUrl && !imageFailed) {
    return (
      <div className={cn(bookCoverSize({ size }), 'flex items-center justify-center', className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverUrl}
          alt={title ? `${title} 표지` : '책 표지'}
          className={'h-auto max-h-full w-auto max-w-full rounded-sm shadow-sm'}
          onError={() => setImageFailed(true)}
        />
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={title ? `${title} 표지` : '책 표지'}
      className={cn(
        bookCoverSize({ size }),
        'flex items-center justify-center rounded-sm shadow-sm',
        !color && 'bg-olive-400',
        className,
      )}
      style={color ? { backgroundColor: color } : undefined}
    >
      <BookOpen
        aria-hidden="true"
        className={cn(iconSizeBySize[size ?? 'default'], 'text-white')}
      />
    </div>
  );
}
