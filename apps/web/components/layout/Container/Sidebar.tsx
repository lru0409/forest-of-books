'use client';

import Link from 'next/link';

import { cn } from '@/lib/utils';
import { useNavItems } from './useNavItems';

export function Sidebar() {
  const navItems = useNavItems();

  return (
    <nav
      aria-label="주요 메뉴"
      className="bg-primary hidden w-16 overflow-hidden transition-[width] duration-300 ease-in-out md:block lg:w-75"
    >
      {/* 상단 영역 */}
      <div className="text-primary-foreground hidden items-center px-3.5 pt-5 pb-4 lg:flex">
        <Link href="/" className="text-2xl font-semibold whitespace-nowrap">
          책의 숲
        </Link>
      </div>

      {/* 메뉴 영역 */}
      <ul className="mx-2 flex flex-col gap-1 pt-4 lg:pt-0">
        {navItems.map(({ href, icon: Icon, label, isActive }) => {
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive ? 'page' : undefined}
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
