'use client';

import { Star } from 'lucide-react';
import { formatRatingLabel } from './utils';

const RATING_MAX = 5;

interface RatingStarsProps {
  value: number;
}

export function RatingStars({ value }: RatingStarsProps) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex items-center gap-1"
        role="img"
        aria-label={`평점 ${formatRatingLabel(value)}점`}
      >
        {Array.from({ length: RATING_MAX }, (_, index) => {
          const starValue = index + 1;
          const fillAmount = Math.max(0, Math.min(1, value - index));

          return (
            <div key={starValue} aria-hidden="true" className="p-0.5">
              <div className="relative size-7">
                <Star
                  className="fill-muted text-primary/15 absolute inset-0 size-7"
                  aria-hidden="true"
                />
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${fillAmount * 100}%` }}
                >
                  <Star
                    className="absolute inset-0 size-7 fill-amber-300 text-amber-300"
                    aria-hidden="true"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <span className="text-primary text-lg font-medium">{formatRatingLabel(value)}</span>
    </div>
  );
}
