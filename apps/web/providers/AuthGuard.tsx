'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import {
  AUTH_NOTICE_ROUTES,
  GUEST_ONLY_ROUTES,
  LOGIN_REQUIRED_ROUTES,
  consumePostLoginRedirect,
  matchRoute,
} from '@/lib';
import { Container } from '@/components/layout';
import { AuthRequiredNotice } from '@/components/common';
import { useAuthStore } from '@/store/authStore';

export function AuthGuard({ children }: { children: ReactNode }) {
  const token = useAuthStore((state) => state.token);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!hasHydrated) return;

    if (!token) {
      const matched = LOGIN_REQUIRED_ROUTES.find((route) => matchRoute(pathname, route.path));
      if (matched) router.replace(matched.redirectTo);
      return;
    }

    const matched = GUEST_ONLY_ROUTES.find((route) => matchRoute(pathname, route.path));
    // 로그인 직후 /signin, /auth/callback 에서 이 분기로 들어오므로 저장된 복귀 경로를 여기서 소비
    if (matched) router.replace(consumePostLoginRedirect(matched.redirectTo));
  }, [hasHydrated, token, pathname, router]);

  if (!token) {
    const matched = AUTH_NOTICE_ROUTES.find((route) => matchRoute(pathname, route.path));
    if (matched) {
      return (
        <Container>
          <AuthRequiredNotice className="h-full" description={matched.description} />
        </Container>
      );
    }
  }

  return children;
}
