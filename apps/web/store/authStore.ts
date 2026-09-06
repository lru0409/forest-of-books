import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { User } from '@/lib';

// TODO: 보안 강화 리팩토링 시 token을 localStorage(persist) 대신 httpOnly 쿠키로 옮기고,
// 이 store는 user 상태만 남기는 방향 검토 (XSS로 인한 토큰 탈취 방지).
interface AuthData {
  token: string | null;
  user: User | null;
  hasHydrated: boolean;
}

interface AuthActions {
  setToken: (token: string) => void;
  clearToken: () => void;
  setUser: (user: User) => void;
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
