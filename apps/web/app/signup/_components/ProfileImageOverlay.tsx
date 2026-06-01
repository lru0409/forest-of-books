'use client';

import Image from 'next/image';

import { cn } from '@/lib/utils';

interface ProfileImageOverlayProps {
  onClose: () => void;
  onSelect: (imageIndex: number) => void;
  selectedIndex: number | null;
}

const TOTAL = 9;

export const ProfileImageOverlay = ({
  onClose,
  onSelect,
  selectedIndex,
}: ProfileImageOverlayProps) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div className="grid grid-cols-3 gap-5" onClick={(e) => e.stopPropagation()}>
        {Array.from({ length: TOTAL }, (_, index) => (
          <button
            key={index}
            aria-label={`기본 프로필 이미지 ${index + 1}`}
            onClick={() => onSelect(index)}
            className={cn(
              'bg-primary/40 border-primary hover:border-primary-foreground size-35 overflow-hidden rounded-full border-2 transition-all hover:border-4 hover:shadow-[0_0_10px_5px_color-mix(in_srgb,var(--color-primary-foreground)_50%,transparent)]',
              selectedIndex === index && 'border-primary-foreground border-4',
            )}
          >
            <Image
              src={`/images/profile-defaults/${index + 1}.png`}
              alt={`기본 프로필 이미지 ${index + 1}`}
              className="h-full w-full object-cover"
              width={140}
              height={140}
            />
          </button>
        ))}
      </div>
    </div>
  );
};
