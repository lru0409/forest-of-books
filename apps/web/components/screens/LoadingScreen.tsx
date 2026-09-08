import { cn } from '@/lib';
import { Loader2 } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
  className?: string;
}

export function LoadingScreen({ message = '로딩 중...', className }: LoadingScreenProps) {
  return (
    <div
      className={cn(
        'bg-background flex min-h-screen flex-col items-center justify-center gap-4',
        className,
      )}
    >
      <Loader2 className="text-primary size-10 animate-spin" strokeWidth={2} />
      <p className="text-foreground text-lg font-semibold">{message}</p>
    </div>
  );
}
