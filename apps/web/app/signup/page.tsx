'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Container } from '@/components/layout';
import { EmailPasswordStep } from './components/EmailPasswordStep';
import { ProfileStep } from './components/ProfileStep';
import { GenresStep } from './components/GenresStep';
import { Step, TOTAL_STEPS } from './constants';

export default function SignUp() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const step: Step = Math.max(1, Math.min(TOTAL_STEPS, Number(searchParams.get('step') ?? '1')));
  const [isCompleted, setIsCompleted] = useState(false);

  const handleComplete = () => {
    setIsCompleted(true);
    setTimeout(() => {
      router.push('/signin');
    }, 500);
  };

  return (
    <Container className="relative flex min-h-170 justify-center">
      <ProgressBar step={step} total={TOTAL_STEPS} isCompleted={isCompleted} />
      <div className="flex w-125 min-w-80 pt-12 pb-10">
        {step === Step.EMAIL_PASSWORD && <EmailPasswordStep />}
        {step === Step.PROFILE && <ProfileStep />}
        {step === Step.GENRES && <GenresStep onComplete={handleComplete} />}
      </div>
    </Container>
  );
}

const ProgressBar = ({
  step,
  total,
  isCompleted,
}: {
  step: number;
  total: number;
  isCompleted: boolean;
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const width = isCompleted ? '100%' : mounted ? `${((step - 1) / total) * 100}%` : '0%';

  return (
    <div className="bg-secondary/50 absolute top-0 right-0 left-0 h-2">
      <div
        className="bg-primary h-full transition-all duration-500 ease-in-out"
        style={{ width }}
      />
    </div>
  );
};
