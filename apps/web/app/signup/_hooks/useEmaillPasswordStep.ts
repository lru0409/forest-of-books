import { useState, useMemo } from 'react';

import authService from '@/services/auth';
import type { InputState } from '@/components/ui/input';
import { useSignupStore } from '@/store/signupStore';

type EmailCodeSendStatus =
  | 'idle'
  | 'sending'
  | 'sent'
  | 'invalidEmail'
  | 'duplicatedEmail'
  | 'failed';

type EmailCodeVerifyStatus =
  | 'idle'
  | 'verifying'
  | 'verified'
  | 'mismatched'
  | 'expired'
  | 'failed';

type EmailCodeVerifyAttempt = {
  attemptCount: number;
  maxAttempts: number;
};

function useEmailPasswordStep(
  email: string,
  emailVerificationCode: string,
  password: string,
  confirmPassword: string,
) {
  const { emailVerified: defaultEmailVerified } = useSignupStore();

  const [emailCodeSendStatus, setEmailCodeSendStatus] = useState<EmailCodeSendStatus>('idle');
  const [emailCodeVerifyStatus, setEmailCodeVerifyStatus] = useState<EmailCodeVerifyStatus>(
    defaultEmailVerified ? 'verified' : 'idle',
  );
  const [emailCodeVerifyAttempt, setEmailCodeVerifyAttempt] =
    useState<EmailCodeVerifyAttempt | null>(null);
  const isEmailCodeVerifyAttemptExceeded =
    emailCodeVerifyAttempt !== null &&
    emailCodeVerifyAttempt.attemptCount >= emailCodeVerifyAttempt.maxAttempts;

  // TODO: 유틸 함수 사용
  const isEmailValid = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const emailFeedback: { state: InputState; message?: string } = useMemo(() => {
    if (!email) return { state: 'error', message: '이메일을 입력해 주세요.' };
    if (!isEmailValid) return { state: 'error', message: '올바른 이메일 형식을 입력해 주세요.' };

    switch (emailCodeSendStatus) {
      case 'invalidEmail':
        return { state: 'error', message: '올바른 이메일을 입력해 주세요.' };
      case 'duplicatedEmail':
        return { state: 'error', message: '이미 가입된 이메일이에요.' };
      case 'failed':
        return {
          state: 'error',
          message: '인증 코드를 보내지 못했어요. 잠시 후 다시 시도해주세요.',
        };
      case 'idle':
      case 'sending':
      case 'sent':
        return { state: 'default' };
    }
  }, [email, isEmailValid, emailCodeSendStatus]);

  const emailCodeFeedback: { state: InputState; message?: string } = useMemo(() => {
    switch (emailCodeVerifyStatus) {
      case 'verified':
        return { state: 'success', message: '이메일 인증이 완료됐어요.' };
      case 'mismatched': {
        const attemptCountInfo = emailCodeVerifyAttempt
          ? `(${emailCodeVerifyAttempt.attemptCount}/${emailCodeVerifyAttempt.maxAttempts})`
          : '';
        return {
          state: 'error',
          message: isEmailCodeVerifyAttemptExceeded
            ? `인증 코드 입력 횟수를 초과했어요. 다시 요청해주세요. ${attemptCountInfo}`
            : `인증 코드가 일치하지 않아요. ${attemptCountInfo}`,
        };
      }
      case 'expired':
        return { state: 'error', message: '인증 코드가 만료됐어요. 다시 요청해주세요.' };
      case 'failed':
        return {
          state: 'error',
          message: '오류가 발생했어요. 잠시 후 다시 시도해주세요.',
        };
      case 'idle':
      case 'verifying':
        return { state: 'default' };
    }
  }, [emailCodeVerifyStatus, emailCodeVerifyAttempt, isEmailCodeVerifyAttemptExceeded]);

  const passwordFeedback: { state: InputState; message?: string } = useMemo(() => {
    if (!password) return { state: 'error', message: '비밀번호를 입력해 주세요.' };
    // TODO: 유틸 함수 사용
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,16}$/.test(password))
      return { state: 'error', message: '8~16자의 영문 대소문자, 숫자, 특수문자를 조합해 주세요.' };
    return { state: 'default' };
  }, [password]);

  const confirmPasswordFeedback: { state: InputState; message?: string } = useMemo(() => {
    if (!confirmPassword) return { state: 'error', message: '비밀번호를 한 번 더 입력해 주세요.' };
    if (password !== confirmPassword)
      return { state: 'error', message: '비밀번호가 일치하지 않습니다.' };
    return { state: 'default' };
  }, [confirmPassword, password]);

  const canSendEmailCode = (() => {
    if (!isEmailValid) return false;
    if (emailCodeSendStatus === 'sending') return false;
    if (emailCodeVerifyStatus === 'verifying' || emailCodeVerifyStatus === 'verified') return false;
    if (emailCodeSendStatus === 'sent') {
      if (emailCodeVerifyStatus === 'idle') return false;
      if (emailCodeVerifyStatus === 'mismatched' && !isEmailCodeVerifyAttemptExceeded) return false;
    }
    return true;
  })();

  const canVerifyEmailCode = (() => {
    if (!emailVerificationCode) return false;
    if (emailCodeSendStatus === 'sending') return false;
    if (
      emailCodeVerifyStatus === 'verifying' ||
      emailCodeVerifyStatus === 'verified' ||
      emailCodeVerifyStatus === 'expired' ||
      isEmailCodeVerifyAttemptExceeded
    )
      return false;
    return true;
  })();

  const resetEmailVerification = () => {
    setEmailCodeSendStatus('idle');
    setEmailCodeVerifyStatus('idle');
    setEmailCodeVerifyAttempt(null);
  };

  const handleSendEmailVerificationCode = async () => {
    setEmailCodeSendStatus('sending');
    setEmailCodeVerifyStatus('idle');
    setEmailCodeVerifyAttempt(null);

    try {
      const result = await authService.sendEmailVerificationCode(email);

      if (result.isSuccess) {
        setEmailCodeSendStatus('sent');
      } else if (result.statusCode === 400) {
        setEmailCodeSendStatus('invalidEmail');
      } else if (result.statusCode === 409) {
        setEmailCodeSendStatus('duplicatedEmail');
      } else {
        setEmailCodeSendStatus('failed');
      }
    } catch {
      setEmailCodeSendStatus('failed');
    }
  };

  const handleVerifyEmailCode = async () => {
    setEmailCodeVerifyStatus('verifying');

    try {
      const result = await authService.verifyEmailCode(email, emailVerificationCode);
      let emailCodeVerifyAttempt: EmailCodeVerifyAttempt | null = null;

      if (result.isSuccess) {
        setEmailCodeVerifyStatus('verified');
      } else if (result.statusCode === 410) {
        setEmailCodeVerifyStatus('expired');
      } else if (
        result.statusCode === 400 &&
        result.errorCode === 'EMAIL_VERIFICATION_CODE_MISMATCH' &&
        result.data
      ) {
        emailCodeVerifyAttempt = result.data;
        setEmailCodeVerifyStatus('mismatched');
      } else {
        setEmailCodeVerifyStatus('failed');
      }
      setEmailCodeVerifyAttempt(emailCodeVerifyAttempt);
    } catch {
      setEmailCodeVerifyStatus('failed');
      setEmailCodeVerifyAttempt(null);
    }
  };

  return {
    emailCodeSendStatus,
    emailCodeVerifyStatus,
    emailFeedback,
    emailCodeFeedback,
    passwordFeedback,
    confirmPasswordFeedback,
    canSendEmailCode,
    canVerifyEmailCode,
    resetEmailVerification,
    handleSendEmailVerificationCode,
    handleVerifyEmailCode,
  };
}

export default useEmailPasswordStep;
