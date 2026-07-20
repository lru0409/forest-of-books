'use client';

import { useEffect } from 'react';

import { Container } from '@/components/layout';
import AuthService from '@/services/auth';
import { useAuthStore } from '@/store/authStore';

export default function Home() {
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    if (token) {
      AuthService.getMe(token).then((result) => console.log(result));
    }
  }, [token]);

  return (
    <Container>
      <h1 className="text-2xl font-semibold">커뮤니티</h1>
    </Container>
  );
}
