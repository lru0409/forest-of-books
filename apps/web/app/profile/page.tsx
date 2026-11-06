'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { Container } from '@/components/layout';
import { Spinner, StatusNotice } from '@/components/common';
import { useAuthStore } from '@/store/authStore';

export default function ProfilePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (user) {
      router.replace(`/profile/${user.id}`);
    }
  }, [user, router]);

  return (
    <Container>
      <StatusNotice
        className="h-full"
        icon={<Spinner className="text-primary size-12" />}
        title="프로필로 이동 중이에요"
      />
    </Container>
  );
}
