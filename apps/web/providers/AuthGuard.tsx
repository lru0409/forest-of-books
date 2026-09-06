'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { LOGIN_REQUIRED_ROUTES } from '@/lib';
import { useAuthStore } from '@/store/authStore';

export function AuthGuard({ children }: { children: ReactNode }) {
  const token = useAuthStore((state) => state.token);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!hasHydrated || token) return;

    const matched = LOGIN_REQUIRED_ROUTES.find(
      (route) => pathname === route.path || pathname.startsWith(`${route.path}/`),
    );
    if (matched) router.replace(matched.redirectTo);
  }, [hasHydrated, token, pathname, router]);

  return children;
}
