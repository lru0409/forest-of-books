import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

import { Step, TOTAL_STEPS } from '../constants';
import { useSignupStore } from '@/store/signupStore';

function useStepGuard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stepParam = searchParams.get('step') ?? '1';
  const step: Step = Math.max(1, Math.min(TOTAL_STEPS, Number(stepParam)));

  const {
    email,
    emailVerified,
    password,
    confirmPassword,
    nickname,
    nicknameVerified,
    bio,
    isSocialLogin,
    update,
  } = useSignupStore();

  const [hasHydrated, setHasHydrated] = useState(false);

  // TODO: validation 시 직접 정규식 사용하는 대신 유틸 함수 사용

  const canProceedToProfileStep = useMemo(() => {
    if (!hasHydrated) return null;
    if (isSocialLogin) return true;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return false;
    if (!emailVerified) return false;
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,16}$/.test(password)) return false;
    if (password !== confirmPassword) return false;
    return true;
  }, [hasHydrated, isSocialLogin, email, emailVerified, password, confirmPassword]);

  const canProceedToGenresStep = useMemo(() => {
    if (!hasHydrated) return null;
    if (!canProceedToProfileStep) return false;

    if (!/^[가-힣a-zA-Z0-9]{2,12}$/.test(nickname)) return false;
    if (!nicknameVerified) return false;
    if (bio.length > 160) return false;
    return true;
  }, [hasHydrated, canProceedToProfileStep, nickname, nicknameVerified, bio]);

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
      return;
    }
    const unsubscribe = useSignupStore.persist.onFinishHydration(() => setHasHydrated(true));
    return unsubscribe;
  }, []);

  useEffect(
    function redirectToValidStep() {
      if (step === Step.PROFILE && canProceedToProfileStep === false) {
        router.replace(`/signup?step=${Step.EMAIL_PASSWORD}`);
      } else if (step === Step.GENRES && canProceedToGenresStep === false) {
        router.replace(
          `/signup?step=${canProceedToProfileStep ? Step.PROFILE : Step.EMAIL_PASSWORD}`,
        );
      }
    },
    [step, canProceedToProfileStep, canProceedToGenresStep, router],
  );

  return {
    step,
    canProceedToProfileStep,
    canProceedToGenresStep,
  };
}

export default useStepGuard;
