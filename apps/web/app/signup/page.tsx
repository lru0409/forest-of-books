'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Container } from '@/components/layout';
import { useSignupStore } from '@/store/signupStore';
import { EmailPasswordStep } from './components/EmailPasswordStep';
import { ProfileStep } from './components/ProfileStep';
import { GenresStep } from './components/GenresStep';
import { ProgressBar } from './components/ProgressBar';
import { Step, TOTAL_STEPS } from './constants';
import { emailPasswordSchema, profileSchema } from './schemas';

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
  const { email, password, confirmPassword, nickname, bio } = useSignupStore();

  const stepParam = searchParams.get('step') ?? '1';
  const step: Step = Math.max(1, Math.min(TOTAL_STEPS, Number(stepParam)));

  const [hasHydrated, setHasHydrated] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const canProceedToProfileStep = emailPasswordSchema.safeParse({
    email,
    password,
    confirmPassword,
  }).success;
  const canProceedToGenresStep =
    canProceedToProfileStep && profileSchema.safeParse({ nickname, bio }).success;

  useEffect(function checkHydration() {
    if (useSignupStore.persist.hasHydrated()) {
      setHasHydrated(true);
    } else {
      const unsubscribe = useSignupStore.persist.onFinishHydration(() => setHasHydrated(true));
      return unsubscribe;
    }
  }, []);

  useEffect(
    function redirectToValidStep() {
      if (!hasHydrated) return;
      if (step === Step.PROFILE && !canProceedToProfileStep) {
        router.replace(`/signup?step=${Step.EMAIL_PASSWORD}`);
      } else if (step === Step.GENRES && !canProceedToGenresStep) {
        router.replace(
          `/signup?step=${canProceedToProfileStep ? Step.PROFILE : Step.EMAIL_PASSWORD}`,
        );
      }
    },
    [step, canProceedToProfileStep, canProceedToGenresStep, router, hasHydrated],
  );

  useEffect(
    function redirectAfterComplete() {
      if (isCompleted) {
        const timeout = setTimeout(() => {
          router.push('/signin');
        }, 500);
        return () => clearTimeout(timeout);
      }
    },
    [isCompleted, router],
  );

  if (step === Step.PROFILE && (!hasHydrated || !canProceedToProfileStep)) return null;
  if (step === Step.GENRES && (!hasHydrated || !canProceedToGenresStep)) return null;

  return (
    <Container className="relative flex min-h-170 justify-center">
      <ProgressBar step={step} total={TOTAL_STEPS} isCompleted={isCompleted} />
      <div className="flex w-125 min-w-80 pt-16 pb-10">
        {step === Step.EMAIL_PASSWORD && <EmailPasswordStep />}
        {step === Step.PROFILE && <ProfileStep />}
        {step === Step.GENRES && <GenresStep onComplete={() => setIsCompleted(true)} />}
      </div>
    </Container>
  );
}
