'use client';

import { useEffect, type ReactNode } from 'react';

import AuthService from '@/services/auth';
import { useAuthStore } from '@/store/authStore';

export function AuthProvider({ children }: { children: ReactNode }) {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const clearToken = useAuthStore((state) => state.clearToken);

  useEffect(() => {
    if (!token || user) return;

    AuthService.getMe(token).then((result) => {
      if (result.isSuccess) {
        setUser(result.data);
      } else {
        clearToken();
      }
    });
  }, [token, user, setUser, clearToken]);

  return children;
}
