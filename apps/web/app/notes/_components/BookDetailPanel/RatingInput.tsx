'use client';

import { useRef, useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatRatingLabel } from './utils';

const RATING_MAX = 5;
const RATING_STEP = 0.5;
const INTEGER_SNAP_ZONE = 0.2;
const DRAG_THRESHOLD_PX = 5;

interface RatingInputProps {
  rating: number;
  onChange: (rating: number) => void;
}

export function RatingInput({ rating, onChange }: RatingInputProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartXRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const [liveValue, setLiveValue] = useState<number | null>(null);

  const getValueFromPointer = (clientX: number) => {
    if (!containerRef.current) return 0;
    const rect = containerRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(clientX - rect.left, rect.width)) / rect.width;
    const raw = ratio * RATING_MAX;

    const floored = Math.floor(raw);
    const frac = raw - floored;
    const snappedFrac = frac < INTEGER_SNAP_ZONE ? 0 : frac > 1 - INTEGER_SNAP_ZONE ? 1 : 0.5;

    return Math.max(0, Math.min(floored + snappedFrac, RATING_MAX));
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragStartXRef.current = e.clientX;
    isDraggingRef.current = false;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (!isDraggingRef.current) {
        if (Math.abs(moveEvent.clientX - dragStartXRef.current!) < DRAG_THRESHOLD_PX) return;
        isDraggingRef.current = true;
        document.body.style.cursor = 'grabbing';
      }
      setLiveValue(getValueFromPointer(moveEvent.clientX));
    };

    const handlePointerUp = (upEvent: PointerEvent) => {
      if (isDraggingRef.current) {
        onChange(getValueFromPointer(upEvent.clientX));
      } else {
        onChange(Math.round(getValueFromPointer(upEvent.clientX)));
      }

      dragStartXRef.current = null;
      isDraggingRef.current = false;
      setLiveValue(null);
      document.body.style.cursor = '';
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      onChange(Math.min(rating + RATING_STEP, RATING_MAX));
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      onChange(Math.max(rating - RATING_STEP, 0));
    }
  };

  const displayValue = liveValue ?? rating;

  return (
    <div className="flex items-center gap-3">
      <div
        ref={containerRef}
        role="slider"
        aria-label="평점"
        aria-valuenow={displayValue}
        aria-valuemin={0}
        aria-valuemax={RATING_MAX}
        aria-valuetext={`${formatRatingLabel(displayValue)}점`}
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onKeyDown={handleKeyDown}
        className={cn(
          'flex items-center gap-1',
          liveValue !== null ? 'cursor-grabbing' : 'cursor-pointer',
        )}
      >
        {Array.from({ length: RATING_MAX }, (_, index) => {
          const starValue = index + 1;
          const fillAmount = Math.max(0, Math.min(1, displayValue - index));

          return (
            <div key={starValue} className="p-0.5">
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
      <span className="text-primary text-lg font-medium">{formatRatingLabel(displayValue)}</span>
    </div>
  );
}
