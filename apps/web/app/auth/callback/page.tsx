'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

import { useAuthStore } from '@/store/authStore';

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

  // TODO: 로딩 표시
  return <p>로그인 중...</p>;
}

export default function AuthCallback() {
  return (
    // TODO: 로딩 표시
    <Suspense fallback={<p>로그인 중...</p>}>
      <CallbackHandler />
    </Suspense>
  );
}
