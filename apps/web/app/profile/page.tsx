'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoaderCircle } from 'lucide-react';

import { Container } from '@/components/layout';
import { StatusNotice } from '@/components/common';
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
        icon={
          <LoaderCircle
            className="text-primary size-12 animate-spin"
            strokeWidth={2}
            aria-hidden="true"
          />
        }
        title="프로필로 이동 중이에요"
      />
    </Container>
  );
}
