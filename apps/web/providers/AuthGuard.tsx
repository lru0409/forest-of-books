'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { GUEST_ONLY_ROUTES, LOGIN_REQUIRED_ROUTES } from '@/lib';
import { useAuthStore } from '@/store/authStore';

export function AuthGuard({ children }: { children: ReactNode }) {
  const token = useAuthStore((state) => state.token);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!hasHydrated) return;

    if (!token) {
      const matched = LOGIN_REQUIRED_ROUTES.find((route) => route.path === pathname);
      if (matched) router.replace(matched.redirectTo);
      return;
    }

    const matched = GUEST_ONLY_ROUTES.find((route) => route.path === pathname);
    if (matched) router.replace(matched.redirectTo);
  }, [hasHydrated, token, pathname, router]);

  return children;
}
