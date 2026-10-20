'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PartyPopper } from 'lucide-react';

import { Container } from '@/components/layout';
import { Button } from '@/components/ui';
import { consumePostLoginRedirect } from '@/lib';
import { useAuthStore } from '@/store/authStore';
import { useSignupStore } from '@/store/signupStore';

export default function SignupCompletePage() {
  const router = useRouter();
  const setToken = useAuthStore((state) => state.setToken);
  const reset = useSignupStore((state) => state.reset);

  useEffect(() => {
    const token = useSignupStore.getState().registeredToken;
    if (token) setToken(token);
    reset();
  }, [setToken, reset]);

  return (
    <Container className="flex justify-center">
      <div className="flex w-125 flex-col">
        <div className="flex flex-1 flex-col items-center justify-center gap-8">
          <div className="animate-emerge delay-100">
            <PartyPopper className="text-primary size-30" strokeWidth={1.4} />
          </div>

          <div className="animate-emerge flex flex-col items-center gap-5 delay-300">
            <h1 className="text-4xl font-bold tracking-tight text-[#2d4f2b]">환영합니다</h1>
            <p className="text-center text-base leading-relaxed text-[#7d977b]">
              회원가입이 완료되었습니다.
              <br />
              책의 숲에서 나만의 독서 여정을 지금 시작해 보세요.
            </p>
          </div>
        </div>

        <div className="animate-emerge mb-10 w-full px-4 delay-[450ms]">
          <Button className="w-full" onClick={() => router.replace(consumePostLoginRedirect())}>
            시작하기
          </Button>
        </div>
      </div>
    </Container>
  );
}
