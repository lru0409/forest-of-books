'use client';

import { Star } from 'lucide-react';

import { cn, formatRatingLabel } from '@/lib/utils';

const RATING_MAX = 5;

const SIZE_STYLES = {
  default: {
    root: 'gap-3',
    stars: 'gap-1',
    cell: 'p-0.5',
    box: 'size-7',
    star: 'size-7',
    label: 'text-lg',
  },
  sm: {
    root: 'gap-1.5',
    stars: 'gap-0.5',
    cell: '',
    box: 'size-4',
    star: 'size-4',
    label: 'text-sm',
  },
} as const;

interface RatingStarsProps {
  value: number;
  size?: keyof typeof SIZE_STYLES;
}

export function RatingStars({ value, size = 'default' }: RatingStarsProps) {
  const styles = SIZE_STYLES[size];

  return (
    <div className={cn('flex items-center', styles.root)}>
      <div
        className={cn('flex items-center', styles.stars)}
        role="img"
        aria-label={`평점 ${formatRatingLabel(value)}점`}
      >
        {Array.from({ length: RATING_MAX }, (_, index) => {
          const starValue = index + 1;
          const fillAmount = Math.max(0, Math.min(1, value - index));

          return (
            <div key={starValue} aria-hidden="true" className={styles.cell}>
              <div className={cn('relative', styles.box)}>
                <Star
                  className={cn('fill-muted text-primary/15 absolute inset-0', styles.star)}
                  aria-hidden="true"
                />
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${fillAmount * 100}%` }}
                >
                  <Star
                    className={cn('absolute inset-0 fill-amber-300 text-amber-300', styles.star)}
                    aria-hidden="true"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <span className={cn('text-primary font-medium', styles.label)}>
        {formatRatingLabel(value)}
      </span>
    </div>
  );
}
