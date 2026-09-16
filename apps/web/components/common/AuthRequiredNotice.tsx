'use client';

import { useRouter } from 'next/navigation';
import { UserRoundKey } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { StatusNotice } from './StatusNotice';

interface AuthRequiredNoticeProps {
  description: string;
  className?: string;
}

export function AuthRequiredNotice({ description, className }: AuthRequiredNoticeProps) {
  const router = useRouter();

  return (
    <StatusNotice
      className={className}
      icon={<UserRoundKey className="text-primary size-18" strokeWidth={1.6} aria-hidden="true" />}
      title="로그인이 필요해요"
      description={description}
      action={
        <Button className="mt-6 w-full" onClick={() => router.push('/signin')}>
          로그인하러 가기
        </Button>
      }
    />
  );
}
