'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';
import { useNavItems } from './useNavItems';

export function MobileBottomNavigation() {
  const pathname = usePathname();
  const navItems = useNavItems();

  return (
    <div className="fixed bottom-3 z-40 flex w-full justify-center md:hidden">
      <nav
        aria-label="주요 메뉴"
        className="bg-primary flex items-center gap-7 rounded-full p-1.5 shadow-lg"
      >
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
            >
              <span
                className={cn(
                  'group flex items-center justify-center rounded-full p-2.5 transition-all duration-300 ease-out',
                  isActive ? 'bg-primary-foreground shadow-md' : 'hover:bg-primary-foreground/20',
                )}
              >
                <Icon
                  className={cn(
                    'size-5 transition-colors duration-300',
                    isActive
                      ? 'text-primary'
                      : 'text-primary-foreground/50 group-hover:text-primary-foreground',
                  )}
                  aria-hidden="true"
                  strokeWidth={2.5}
                />
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
