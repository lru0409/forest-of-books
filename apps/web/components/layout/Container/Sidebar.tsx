'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';
import { NAV_ITEMS } from './constants';

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="주요 메뉴"
      className="bg-primary hidden min-h-screen w-16 overflow-hidden transition-[width] duration-300 ease-in-out md:sticky md:top-0 md:block md:self-start lg:w-75"
    >
      {/* 상단 영역 */}
      <div className="text-primary-foreground hidden items-center px-3.5 pt-5 pb-4 lg:flex">
        <Link href="/" className="text-2xl font-semibold whitespace-nowrap">
          책의 숲
        </Link>
      </div>

      {/* 메뉴 영역 */}
      <ul className="mx-2 flex flex-col gap-1 pt-4 lg:pt-0">
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
                <span className="max-w-0 overflow-hidden text-base font-semibold whitespace-nowrap opacity-0 transition-[max-width,opacity] duration-300 lg:max-w-32 lg:opacity-100">
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
