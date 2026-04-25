import { cn } from '@/lib/utils';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function Container({ children, className }: ContainerProps) {
  return (
    <div className="flex justify-center">
      <main className={cn('min-h-screen w-lg px-4', className)}>{children}</main>
    </div>
  );
}
