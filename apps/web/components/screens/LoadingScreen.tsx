import { cn } from '@/lib';

import { BookLoader } from '@/components/common';

interface LoadingScreenProps {
  message?: string;
  className?: string;
}

export function LoadingScreen({ message = '로딩 중...', className }: LoadingScreenProps) {
  return (
    <div
      className={cn(
        'bg-background relative flex min-h-screen flex-col items-center justify-center gap-6 overflow-hidden',
        className,
      )}
    >
      {/* Subtle center glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle closest-side at 50% 50%, rgba(125,151,123,0.50) 0%, transparent 100%)',
        }}
      />

      {/* Book loader */}
      <div className="animate-emerge relative z-10">
        <BookLoader size={148} />
      </div>

      {/* Message */}
      <p className="text-foreground animate-emerge text-md z-sm relative font-medium tracking-[0.28em]">
        {message}
      </p>
    </div>
  );
}
