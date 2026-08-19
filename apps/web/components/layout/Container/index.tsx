import { cn } from '@/lib/utils';
import { Sidebar } from './Sidebar';
import { MobileHeader } from './MobileHeader';
import { MobileBottomNavigation } from './MobileBottomNavigation';

interface ContainerProps {
  children: React.ReactNode;
  aside?: React.ReactNode;
  className?: string;
  showBottomNav?: boolean;
}

export function Container({ children, aside, className, showBottomNav = true }: ContainerProps) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <MobileHeader />
      <Sidebar />
      <main
        className={cn(
          'min-w-0 flex-1 px-6 pt-6 pb-20 md:px-10 md:pt-8 md:pb-10',
          !showBottomNav && 'pb-10',
          className,
        )}
      >
        {children}
      </main>
      {aside}
      {showBottomNav && <MobileBottomNavigation />}
    </div>
  );
}
