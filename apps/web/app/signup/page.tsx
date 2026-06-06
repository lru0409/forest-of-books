'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Container, Modal } from '@/components/layout';
import { Button } from '@/components/ui';
import AuthService from '@/services/auth';
import { useSignupStore } from '@/store/signupStore';
import { useAuthStore } from '@/store/authStore';
import { useDialog } from '@/context/dialog';
import { EmailPasswordStep, GenresStep, ProfileStep, ProgressBar } from './_components';
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
  const { openDialog, closeDialog } = useDialog();
  const { email, password, confirmPassword, nickname, bio, genres, isSocialLogin, update, reset } =
    useSignupStore();
  const { setToken } = useAuthStore();

  const stepParam = searchParams.get('step') ?? '1';
  const step: Step = Math.max(1, Math.min(TOTAL_STEPS, Number(stepParam)));

  const [hasHydrated, setHasHydrated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const canProceedToProfileStep =
    isSocialLogin ||
    emailPasswordSchema.safeParse({
      email,
      password,
      confirmPassword,
    }).success;
  const canProceedToGenresStep =
    canProceedToProfileStep && profileSchema.safeParse({ nickname, bio }).success;

  useEffect(
    function detectSocialLoginRedirect() {
      if (searchParams.get('social_login') === 'true') {
        update({ isSocialLogin: true });
        router.replace(`/signup?step=${Step.PROFILE}`);
      }
    },
    [searchParams, update, router],
  );

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
        // TODO: 화면 전환 시 이상함
        const timeout = setTimeout(() => {
          router.push('/signup/complete');
          reset();
        }, 500);
        return () => clearTimeout(timeout);
      }
    },
    [isCompleted, router, reset],
  );

  const handleSocialRegister = async (): Promise<string | null> => {
    const result = await AuthService.socialRegister({ nickname, bio, preferredGenres: genres });
    if (result.isSuccess) {
      return result.data.token;
    }
    // 소셜 로그인 pending token 만료
    if (result.statusCode === 401) {
      openDialog(
        <Modal
          title={'소셜 로그인 세션이 만료되었어요.\n소셜 로그인부터 다시 시작해 주세요.'}
          buttons={[
            <Button
              key="login"
              onClick={() => {
                // TODO: 로그인 페이지로 이동이 안 됨
                router.push('/signin');
                closeDialog();
                reset();
              }}
            >
              로그인으로 이동
            </Button>,
          ]}
        />,
      );
      return null;
    }
    // unknown error
    openDialog(
      <Modal
        title={'오류가 발생했습니다.\n잠시 후 다시 시도해주세요.'}
        buttons={[
          <Button key="close" onClick={closeDialog}>
            확인
          </Button>,
        ]}
      />,
    );
    return null;
  };

  const handleGeneralRegister = async (): Promise<string | null> => {
    const result = await AuthService.generalRegister({
      email,
      password,
      nickname,
      bio,
      preferredGenres: genres,
    });
    if (result.isSuccess) {
      return result.data.token;
    }
    // 이미 가입된 계정
    if (result.statusCode === 409) {
      openDialog(
        <Modal
          title={'이미 가입된 이메일이에요.\n로그인해 주세요.'}
          buttons={[
            <Button
              key="login"
              onClick={() => {
                router.push('/signin');
                closeDialog();
                reset();
              }}
            >
              로그인으로 이동
            </Button>,
          ]}
        />,
      );
      return null;
    }
    // unknown error
    openDialog(
      <Modal
        title={'오류가 발생했습니다.\n잠시 후 다시 시도해주세요.'}
        buttons={[
          <Button key="close" onClick={closeDialog}>
            확인
          </Button>,
        ]}
      />,
    );
    return null;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const token = isSocialLogin ? await handleSocialRegister() : await handleGeneralRegister();
      if (token) {
        setToken(token);
        setIsCompleted(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === Step.PROFILE && (!hasHydrated || !canProceedToProfileStep)) return null;
  if (step === Step.GENRES && (!hasHydrated || !canProceedToGenresStep)) return null;

  return (
    <Container className="relative flex min-h-170 justify-center">
      <ProgressBar step={step} total={TOTAL_STEPS} isCompleted={isCompleted} />
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
