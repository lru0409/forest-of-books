import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { User } from '@/lib';

interface AuthData {
  token: string | null;
  user: User | null;
}

interface AuthActions {
  setToken: (token: string) => void;
  clearToken: () => void;
  setUser: (user: User) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthData & AuthActions>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setToken: (token) => set({ token }),
      clearToken: () => set({ token: null, user: null }),
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
    }),
    {
      name: 'auth',
    },
  ),
);
