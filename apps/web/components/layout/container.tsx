import { cn } from '@/lib/utils';
import { Sidebar } from './sidebar';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function Container({ children, className }: ContainerProps) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className={cn('min-w-0 flex-1 px-4', className)}>{children}</main>
    </div>
  );
}
