'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useLocalStorage } from '@/lib';
import { NAV_ITEMS } from './constants';

export function Sidebar() {
  const pathname = usePathname();

  const [isCollapsed, setIsCollapsed] = useLocalStorage('sidebar-collapsed', true);

  return (
    <nav
      aria-label="주요 메뉴"
      className={cn(
        'bg-primary hidden min-h-screen shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out md:block',
        isCollapsed ? 'w-16' : 'w-75',
      )}
    >
      {/* 상단 영역 */}
      <div className="text-primary-foreground flex items-center px-3.5 pt-5 pb-4">
        <Link
          href="/"
          aria-hidden={isCollapsed}
          className={cn(
            'overflow-hidden text-2xl font-semibold whitespace-nowrap transition-[max-width,opacity] duration-300',
            isCollapsed ? 'max-w-0 opacity-0' : 'max-w-32 opacity-100',
          )}
        >
          책의 숲
        </Link>
        <button
          type="button"
          aria-label={isCollapsed ? '사이드바 펼치기' : '사이드바 접기'}
          aria-expanded={!isCollapsed}
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hover:bg-primary-foreground/20 ml-auto flex size-9 cursor-pointer items-center justify-center rounded-full transition-colors"
        >
          <ChevronLeft
            className={cn('size-5 transition-transform duration-500', isCollapsed && 'rotate-180')}
            aria-hidden="true"
          />
        </button>
      </div>

      {/* 메뉴 영역 */}
      <ul className="mx-2 flex flex-col gap-1">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);

          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  'flex h-11 items-center gap-3 rounded-lg px-3.5 transition-colors',
                  isActive
                    ? 'bg-primary-foreground text-primary'
                    : 'text-primary-foreground hover:bg-primary-foreground/20',
                )}
              >
                <span className="flex size-5 shrink-0 items-center justify-center">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span
                  className={cn(
                    'overflow-hidden text-base font-semibold whitespace-nowrap transition-[max-width,opacity] duration-300',
                    isCollapsed ? 'max-w-0 opacity-0' : 'max-w-32 opacity-100',
                  )}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
