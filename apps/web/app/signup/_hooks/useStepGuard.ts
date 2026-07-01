import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

import { isValidEmail, isValidNickname, isValidPassword } from '@/lib/validators';
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

  const canProceedToProfileStep = useMemo(() => {
    if (!hasHydrated) return null;
    if (isSocialLogin) return true;

    if (!isValidEmail(email)) return false;
    if (!emailVerified) return false;
    if (!isValidPassword(password)) return false;
    if (password !== confirmPassword) return false;
    return true;
  }, [hasHydrated, isSocialLogin, email, emailVerified, password, confirmPassword]);

  const canProceedToGenresStep = useMemo(() => {
    if (!hasHydrated) return null;
    if (!canProceedToProfileStep) return false;

    if (!isValidNickname(nickname)) return false;
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
