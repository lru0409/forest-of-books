import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { Me } from '@/lib';

interface AuthData {
  token: string | null;
  user: Me | null;
  hasHydrated: boolean;
}

interface AuthActions {
  setToken: (token: string) => void;
  clearToken: () => void;
  setUser: (user: Me) => void;
  clearUser: () => void;
  setHasHydrated: (hasHydrated: boolean) => void;
}

export const useAuthStore = create<AuthData & AuthActions>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      hasHydrated: false,
      setToken: (token) => set({ token }),
      clearToken: () => set({ token: null, user: null }),
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: 'auth',
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    },
  ),
);
