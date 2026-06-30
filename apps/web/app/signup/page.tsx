'use client';

import { Suspense } from 'react';

import { Step, TOTAL_STEPS } from './constants';
import { Container } from '@/components/layout';
import { EmailPasswordStep, GenresStep, ProfileStep, ProgressBar } from './_components';
import useStepGuard from './_hooks/useStepGuard';
import useRegistration from './_hooks/useRegistration';

export default function SignUpPage() {
  return (
    <Suspense>
      <SignUpContent />
    </Suspense>
  );
}

function SignUpContent() {
  const { step, canProceedToProfileStep, canProceedToGenresStep } = useStepGuard();
  const { handleSubmit, isSubmitting, handleProgressComplete } = useRegistration();

  if (step === Step.PROFILE && !canProceedToProfileStep) return null;
  if (step === Step.GENRES && !canProceedToGenresStep) return null;

  return (
    <Container className="relative flex min-h-170 justify-center">
      <ProgressBar
        step={step}
        total={TOTAL_STEPS}
        isSubmitting={isSubmitting}
        onComplete={handleProgressComplete}
      />
      <div className="flex w-125 min-w-80 pt-16 pb-10">
        {step === Step.EMAIL_PASSWORD && <EmailPasswordStep />}
        {step === Step.PROFILE && <ProfileStep />}
        {step === Step.GENRES && (
          <GenresStep onComplete={handleSubmit} isSubmitting={isSubmitting} />
        )}
      </div>
    </Container>
  );
}
