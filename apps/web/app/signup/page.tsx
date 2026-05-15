'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Container } from '@/components/layout';
import { EmailPasswordStep } from './components/EmailPasswordStep';
import { ProfileStep } from './components/ProfileStep';
import { GenresStep } from './components/GenresStep';
import { ProgressBar } from './components/ProgressBar';
import { Step, TOTAL_STEPS } from './constants';

// TODO: 입력 데이터 저장 필요 + 폼 형태로 전환 (zustand, React Hook Form?)
// TODO: 스텝 가드 필요

export default function SignUpPage() {
  return (
    <Suspense>
      <SignUpContent />
    </Suspense>
  );
}

function SignUpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const stepParam = searchParams.get('step') ?? '1';
  const step: Step = Math.max(1, Math.min(TOTAL_STEPS, Number(stepParam)));

  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (isCompleted) {
      const timeout = setTimeout(() => {
        router.push('/signin');
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [isCompleted, router]);

  const handleComplete = () => {
    setIsCompleted(true);
    setTimeout(() => {
      router.push('/signin');
    }, 500);
  };

  return (
    <Container className="relative flex min-h-170 justify-center">
      <ProgressBar step={step} total={TOTAL_STEPS} isCompleted={isCompleted} />
      <div className="flex w-125 min-w-80 pt-16 pb-10">
        {step === Step.EMAIL_PASSWORD && <EmailPasswordStep />}
        {step === Step.PROFILE && <ProfileStep />}
        {step === Step.GENRES && <GenresStep onComplete={handleComplete} />}
      </div>
    </Container>
  );
}
