'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

import { useAuthStore } from '@/store/authStore';
import { LoadingScreen } from '@/components/screens/LoadingScreen';

function CallbackHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const setToken = useAuthStore((state) => state.setToken);

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      router.replace('/signin');
      return;
    }
    setToken(token);
    router.replace('/');
  }, [searchParams, router, setToken]);

  return <LoadingScreen message="로그인 중..." />;
}

export default function AuthCallback() {
  return (
    <Suspense fallback={<LoadingScreen message="로그인 중..." />}>
      <CallbackHandler />
    </Suspense>
  );
}
