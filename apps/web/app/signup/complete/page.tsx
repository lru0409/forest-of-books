'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { Container } from '@/components/layout';
import { Button } from '@/components/ui';
import { useSignupStore } from '@/store/signupStore';

export default function SignupCompletePage() {
  const reset = useSignupStore((state) => state.reset);

  useEffect(() => {
    reset();
  }, [reset]);

  return (
    <Container className="flex justify-center">
      <div className="flex w-125 min-w-80 flex-col">
        <div className="flex flex-1 flex-col items-center justify-center gap-3">
          <div className="animate-emerge delay-100">
            <Image
              src="/images/graphics/complete.png"
              alt="회원가입 완료"
              width={200}
              height={200}
            />
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
          <Button asChild className="w-full">
            <Link href="/">시작하기</Link>
          </Button>
        </div>
      </div>
    </Container>
  );
}
