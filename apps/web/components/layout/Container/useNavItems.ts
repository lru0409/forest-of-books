import { usePathname } from 'next/navigation';

import { matchRoute } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { NAV_ITEMS } from './constants';

export function isNavItemActive(pathname: string, href: string, userId?: string) {
  if (href === '/')
    return ['/', '/books/*', '/posts/*'].some((pattern) => matchRoute(pathname, pattern));
  if (href === '/profile') {
    return (
      pathname === '/profile' ||
      pathname === '/profile/edit' ||
      (!!userId && pathname === `/profile/${userId}`)
    );
  }
  return pathname.startsWith(href);
}

export function useNavItems() {
  const pathname = usePathname();
  const isLoggedIn = useAuthStore((state) => state.token !== null);
  const userId = useAuthStore((state) => state.user?.id);

  return NAV_ITEMS.filter((item) => !item.loggedInOnly || isLoggedIn).map((item) => ({
    ...item,
    isActive: isNavItemActive(pathname, item.href, userId),
  }));
}
