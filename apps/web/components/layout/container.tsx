import { cn } from '@/lib/utils';
import { Sidebar } from './sidebar';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function Container({ children, className }: ContainerProps) {
  return (
    <div className="flex">
      <Sidebar />
      <main className={cn('h-screen px-4', className)}>{children}</main>
    </div>
  );
}
