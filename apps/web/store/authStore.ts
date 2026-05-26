import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthData {
  token: string | null;
}

interface AuthActions {
  setToken: (token: string) => void;
  clearToken: () => void;
}

export const useAuthStore = create<AuthData & AuthActions>()(
  persist(
    (set) => ({
      token: null,
      setToken: (token) => set({ token }),
      clearToken: () => set({ token: null }),
    }),
    {
      name: 'auth',
    },
  ),
);
