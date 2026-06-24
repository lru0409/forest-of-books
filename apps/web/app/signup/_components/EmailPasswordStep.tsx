'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button, Input } from '@/components/ui';
import { useSignupStore } from '@/store/signupStore';
import { Step } from '../constants';
import authService from '@/services/auth';

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

interface EmailCodeVerifyAttempt {
  attemptCount: number;
  maxAttempts: number;
}

export const EmailPasswordStep = () => {
  const router = useRouter();
  const {
    update,
    email: defaultEmail,
    password: defaultPassword,
    confirmPassword: defaultConfirmPassword,
    emailVerified: defaultEmailVerified,
  } = useSignupStore();

  const [email, setEmail] = useState(defaultEmail);
  const [emailCodeSendStatus, setEmailCodeSendStatus] = useState<EmailCodeSendStatus>('idle');
  const [emailCodeVerifyStatus, setEmailCodeVerifyStatus] = useState<EmailCodeVerifyStatus>(
    defaultEmailVerified ? 'verified' : 'idle',
  );
  const [emailVerificationCode, setEmailVerificationCode] = useState('');
  const [emailCodeVerifyAttempt, setEmailCodeVerifyAttempt] =
    useState<EmailCodeVerifyAttempt | null>(null);

  const [password, setPassword] = useState(defaultPassword);
  const [confirmPassword, setConfirmPassword] = useState(defaultConfirmPassword);

  const [touched, setTouched] = useState({
    email: false,
    password: false,
    confirmPassword: false,
  });

  const isEmailCodeVerifyAttemptExceeded =
    emailCodeVerifyAttempt !== null &&
    emailCodeVerifyAttempt.attemptCount >= emailCodeVerifyAttempt.maxAttempts;

  const isEmailValid = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const emailFeedback = ((): { state: 'error' | 'success' | 'default'; message?: string } => {
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
  })();

  const emailCodeFeedback = ((): {
    state: 'error' | 'success' | 'default';
    message?: string;
  } => {
    switch (emailCodeVerifyStatus) {
      case 'verified':
        return { state: 'success', message: '이메일 인증이 완료됐어요.' };
      case 'mismatched':
        if (emailCodeVerifyAttempt) {
          const attemptCountInfo = `(${emailCodeVerifyAttempt.attemptCount}/${emailCodeVerifyAttempt.maxAttempts})`;
          return {
            state: 'error',
            message: isEmailCodeVerifyAttemptExceeded
              ? `인증 코드 입력 횟수를 초과했어요. 다시 요청해주세요. ${attemptCountInfo}`
              : `인증 코드가 일치하지 않아요. ${attemptCountInfo}`,
          };
        }
        return { state: 'default' };
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
  })();

  const passwordFeedback = ((): { state: 'error' | 'success' | 'default'; message?: string } => {
    if (!password) return { state: 'error', message: '비밀번호를 입력해 주세요.' };
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,16}$/.test(password))
      return { state: 'error', message: '8~16자의 영문 대소문자, 숫자, 특수문자를 조합해 주세요.' };
    return { state: 'default' };
  })();

  const confirmPasswordFeedback = ((): {
    state: 'error' | 'success' | 'default';
    message?: string;
  } => {
    if (!confirmPassword) return { state: 'error', message: '비밀번호를 한 번 더 입력해 주세요.' };
    if (password !== confirmPassword)
      return { state: 'error', message: '비밀번호가 일치하지 않습니다.' };
    return { state: 'default' };
  })();

  const handleSendEmailVerificationCode = async (email: string) => {
    setEmailVerificationCode('');
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

  const handleVerifyEmailCode = async (email: string) => {
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

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailCodeVerifyStatus !== 'verified') return;
    update({ email, password, confirmPassword, emailVerified: true });
    router.push(`/signup?step=${Step.PROFILE}`);
  };

  return (
    <form className="flex flex-1 flex-col justify-between" onSubmit={onSubmit}>
      <div>
        <h1 className="mb-2 text-3xl font-bold">계정 만들기</h1>
        <p className="text-secondary mb-8 text-base">이메일과 비밀번호를 입력해 주세요.</p>

        <label htmlFor="email" className="mb-2 block text-lg font-semibold">
          이메일
        </label>
        <Input
          id="email"
          type="email"
          placeholder="이메일을 입력하세요."
          value={email}
          maxLength={254}
          onChange={(e) => {
            setEmail(e.target.value);
            setEmailCodeSendStatus('idle');
            setEmailCodeVerifyStatus('idle');
            setEmailCodeVerifyAttempt(null);
            setEmailVerificationCode('');
          }}
          onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
          readOnly={emailCodeSendStatus === 'sending' || emailCodeVerifyStatus === 'verifying'}
          clearable={emailCodeSendStatus !== 'sending' && emailCodeVerifyStatus !== 'verifying'}
          state={touched.email ? emailFeedback.state : 'default'}
          message={touched.email ? emailFeedback.message : undefined}
          suffix={
            <Button
              type="button"
              size="xs"
              onClick={() => handleSendEmailVerificationCode(email)}
              disabled={
                !isEmailValid ||
                emailCodeSendStatus === 'sending' ||
                emailCodeVerifyStatus === 'verifying' ||
                emailCodeVerifyStatus === 'verified' ||
                (emailCodeSendStatus === 'sent' &&
                  emailCodeVerifyStatus !== 'expired' &&
                  emailCodeVerifyStatus !== 'failed' &&
                  !isEmailCodeVerifyAttemptExceeded)
              }
              isLoading={emailCodeSendStatus === 'sending'}
              className="-mr-1.5 w-16.5"
            >
              {emailCodeVerifyStatus === 'verified' ? '인증 완료' : '인증 요청'}
            </Button>
          }
          className="mb-2"
        />

        <div
          className={[
            'transition-all duration-300',
            emailCodeSendStatus === 'sent' ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0',
          ].join(' ')}
        >
          <Input
            id="emailVerificationCode"
            type="text"
            inputMode="numeric"
            placeholder="인증 코드를 입력하세요."
            value={emailVerificationCode}
            maxLength={6}
            onChange={(e) => setEmailVerificationCode(e.target.value)}
            readOnly={
              emailCodeSendStatus === 'sending' ||
              emailCodeVerifyStatus === 'verifying' ||
              emailCodeVerifyStatus === 'verified' ||
              isEmailCodeVerifyAttemptExceeded
            }
            clearable={
              emailCodeSendStatus !== 'sending' &&
              emailCodeVerifyStatus !== 'verifying' &&
              emailCodeVerifyStatus !== 'verified' &&
              !isEmailCodeVerifyAttemptExceeded
            }
            state={emailCodeFeedback.state}
            message={emailCodeFeedback.message}
            suffix={
              <Button
                type="button"
                size="xs"
                onClick={() => handleVerifyEmailCode(email)}
                disabled={
                  !emailVerificationCode ||
                  emailCodeSendStatus === 'sending' ||
                  emailCodeVerifyStatus === 'verifying' ||
                  emailCodeVerifyStatus === 'verified' ||
                  emailCodeVerifyStatus === 'expired' ||
                  isEmailCodeVerifyAttemptExceeded
                }
                isLoading={emailCodeVerifyStatus === 'verifying'}
                className="-mr-1.5 w-16.5"
              >
                확인
              </Button>
            }
            className="mb-5"
          />
        </div>

        <label htmlFor="password" className="mb-1 block text-lg font-semibold">
          비밀번호
        </label>
        <p className="text-secondary mb-2 text-sm">* 8~16자의 영문 대소문자, 숫자, 특수문자 조합</p>
        <Input
          id="password"
          type="password"
          placeholder="비밀번호를 입력하세요."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
          state={touched.password ? passwordFeedback.state : 'default'}
          message={touched.password ? passwordFeedback.message : undefined}
          className="mb-2"
        />
        <Input
          id="confirmPassword"
          type="password"
          placeholder="비밀번호를 한 번 더 입력하세요."
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          onBlur={() => setTouched((prev) => ({ ...prev, confirmPassword: true }))}
          state={touched.confirmPassword ? confirmPasswordFeedback.state : 'default'}
          message={touched.confirmPassword ? confirmPasswordFeedback.message : undefined}
          className="mb-2"
        />
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}>
          돌아가기
        </Button>
        <Button
          type="submit"
          className="flex-1"
          disabled={
            emailCodeVerifyStatus !== 'verified' ||
            passwordFeedback.state === 'error' ||
            confirmPasswordFeedback.state === 'error'
          }
        >
          다음
        </Button>
      </div>
    </form>
  );
};
