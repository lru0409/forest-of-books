import { useAuthStore } from '@/store/authStore';
import { NAV_ITEMS } from './constants';

export function useNavItems() {
  const isLoggedIn = useAuthStore((state) => state.token !== null);

  return NAV_ITEMS.filter((item) => !item.loggedInOnly || isLoggedIn);
}
