'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Container, Modal } from '@/components/layout';
import { Button } from '@/components/ui';
import AuthService from '@/services/auth';
import { useSignupStore } from '@/store/signupStore';
import { useAuthStore } from '@/store/authStore';
import { useDialog } from '@/context/dialog';
import { EmailPasswordStep, GenresStep, ProfileStep, ProgressBar } from './_components';
import { Step, TOTAL_STEPS } from './constants';
import { type Genre } from '@/lib';

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
  const {
    email,
    emailVerified,
    password,
    confirmPassword,
    nickname,
    nicknameVerified,
    bio,
    profileImageUrl,
    isSocialLogin,
    update,
  } = useSignupStore();
  const { setToken } = useAuthStore();

  const stepParam = searchParams.get('step') ?? '1';
  const step: Step = Math.max(1, Math.min(TOTAL_STEPS, Number(stepParam)));

  const [hasHydrated, setHasHydrated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const progressResolveRef = useRef<(() => void) | null>(null);

  const canProceedToProfileStep =
    isSocialLogin ||
    (emailVerified &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,16}$/.test(password) &&
      password === confirmPassword);
  const canProceedToGenresStep =
    canProceedToProfileStep &&
    nicknameVerified &&
    /^[가-힣a-zA-Z0-9]{2,12}$/.test(nickname) &&
    bio.length <= 160;

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

  const handleSubmit = async (genres: Genre[]) => {
    setIsSubmitting(true);
    setIsCompleting(true);
    const progressPromise = new Promise<void>((resolve) => {
      progressResolveRef.current = resolve;
    });
    const commonPayload = { nickname, bio, profileImageUrl, preferredGenres: genres };
    const apiPromise = isSocialLogin
      ? AuthService.socialRegister(commonPayload)
      : AuthService.generalRegister({ email, password, ...commonPayload });
    // api 응답 수신 && progress bar 끝까지 진행 -> 이후 액션 수행
    const [result] = await Promise.all([apiPromise, progressPromise]);
    setIsSubmitting(false);

    if (result.isSuccess) {
      setToken(result.data.token);
      router.push('/signup/complete');
      return;
    }
    // 소셜 로그인 pending token 만료
    if (isSocialLogin && result.statusCode === 401) {
      openDialog(
        <Modal
          title={'소셜 로그인 세션이 만료되었어요.\n소셜 로그인부터 다시 시작해 주세요.'}
          buttons={[
            <Button
              key="login"
              onClick={() => {
                router.push('/signin');
                closeDialog();
              }}
            >
              로그인으로 이동
            </Button>,
          ]}
          showCloseButton={false}
        />,
      );
      return;
    }
    // 닉네임 중복
    if (result.statusCode === 409 && result.errorCode === 'NICKNAME_ALREADY_EXISTS') {
      openDialog(
        <Modal
          title={'이미 사용 중인 닉네임이에요.\n다른 닉네임을 입력해 주세요.'}
          buttons={[
            <Button
              key="nickname"
              onClick={() => {
                update({ nicknameVerified: false });
                router.push(`/signup?step=${Step.PROFILE}`);
                closeDialog();
              }}
            >
              닉네임 다시 입력하기
            </Button>,
          ]}
          showCloseButton={false}
        />,
      );
      return;
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
        showCloseButton={false}
      />,
    );
  };

  if (step === Step.PROFILE && (!hasHydrated || !canProceedToProfileStep)) return null;
  if (step === Step.GENRES && (!hasHydrated || !canProceedToGenresStep)) return null;

  return (
    <Container className="relative flex min-h-170 justify-center">
      <ProgressBar
        step={step}
        total={TOTAL_STEPS}
        isCompleting={isCompleting}
        onComplete={() => progressResolveRef.current?.()}
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
