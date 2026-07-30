import { cn } from '@/lib/utils';
import { Sidebar } from './Sidebar';
import { MobileHeader } from './MobileHeader';
import { MobileBottomNavigation } from './MobileBottomNavigation';

interface ContainerProps {
  children: React.ReactNode;
  aside?: React.ReactNode;
  className?: string;
}

export function Container({ children, aside, className }: ContainerProps) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <MobileHeader />
      <Sidebar />
      <main className={cn('min-w-0 flex-1 px-4 pb-20 md:pb-15', className)}>{children}</main>
      {aside}
      <MobileBottomNavigation />
    </div>
  );
}
