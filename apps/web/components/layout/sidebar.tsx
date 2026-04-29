'use client';

import { BookOpen, MessageCircle, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/', icon: MessageCircle, label: '커뮤니티' },
  { href: '/notes', icon: BookOpen, label: '독서 노트' },
  { href: '/profile', icon: User, label: '프로필' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="bg-primary h-screen min-w-75">
      <div className="text-primary-foreground p-6 pb-5 text-2xl font-semibold">
        <Link href="/">책의 숲</Link>
      </div>
      <ul className="mx-2 flex flex-col gap-1">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);

          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-5 py-2.5 text-base font-semibold transition-colors',
                  isActive
                    ? 'bg-primary-foreground text-primary'
                    : 'text-primary-foreground hover:bg-primary-foreground hover:text-primary',
                )}
              >
                <Icon className="size-5 shrink-0" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
