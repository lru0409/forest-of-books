'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller, type ControllerFieldState } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button, Input } from '@/components/ui';
import { emailPasswordSchema, type EmailPasswordFormData } from '../schemas';
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
  const [emailCodeSendStatus, setEmailCodeSendStatus] = useState<EmailCodeSendStatus>('idle');
  const [emailCodeVerifyStatus, setEmailCodeVerifyStatus] = useState<EmailCodeVerifyStatus>(
    defaultEmailVerified ? 'verified' : 'idle',
  );
  const [emailVerificationCode, setEmailVerificationCode] = useState('');
  const [emailCodeVerifyAttempt, setEmailCodeVerifyAttempt] =
    useState<EmailCodeVerifyAttempt | null>(null);
  const isEmailCodeVerifyAttemptExceeded =
    emailCodeVerifyAttempt !== null &&
    emailCodeVerifyAttempt.attemptCount >= emailCodeVerifyAttempt.maxAttempts;

  const getEmailFeedback = (
    fieldState: ControllerFieldState,
  ): { state: 'error' | 'success' | 'default'; message?: string } => {
    if (fieldState.isTouched && fieldState.error) {
      return { state: 'error', message: fieldState.error.message };
    }

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
  };

  const getEmailCodeFeedback = (): {
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
  };
  const emailCodeFeedback = getEmailCodeFeedback();

  const {
    control,
    handleSubmit,
    watch,
    trigger,
    getFieldState,
    formState: { errors },
  } = useForm<EmailPasswordFormData>({
    resolver: zodResolver(emailPasswordSchema),
    mode: 'onChange',
    defaultValues: {
      email: defaultEmail,
      password: defaultPassword,
      confirmPassword: defaultConfirmPassword,
    },
  });

  const [email, password, confirmPassword] = watch(['email', 'password', 'confirmPassword']);

  useEffect(
    function validateConfirmPasswordOnPasswordChange() {
      if (getFieldState('password').isTouched) {
        trigger('confirmPassword');
      }
    },
    [password, trigger, getFieldState],
  );

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

  const onSubmit = (data: EmailPasswordFormData) => {
    if (emailCodeVerifyStatus !== 'verified') return;
    update({ ...data, emailVerified: true });
    router.push(`/signup?step=${Step.PROFILE}`);
  };

  return (
    <form className="flex flex-1 flex-col justify-between" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <h1 className="mb-2 text-3xl font-bold">계정 만들기</h1>
        <p className="text-secondary mb-8 text-base">이메일과 비밀번호를 입력해 주세요.</p>

        <label htmlFor="email" className="mb-2 block text-lg font-semibold">
          이메일
        </label>
        <Controller
          name="email"
          control={control}
          render={({ field, fieldState }) => {
            const emailFeedback = getEmailFeedback(fieldState);

            return (
              <Input
                id="email"
                type="email"
                placeholder="이메일을 입력하세요."
                value={field.value}
                maxLength={254}
                onChange={(e) => {
                  field.onChange(e);
                  setEmailCodeSendStatus('idle');
                  setEmailCodeVerifyStatus('idle');
                  setEmailCodeVerifyAttempt(null);
                  setEmailVerificationCode('');
                }}
                onBlur={field.onBlur}
                readOnly={
                  emailCodeSendStatus === 'sending' || emailCodeVerifyStatus === 'verifying'
                }
                clearable={
                  emailCodeSendStatus !== 'sending' && emailCodeVerifyStatus !== 'verifying'
                }
                state={emailFeedback.state}
                message={emailFeedback.message}
                suffix={
                  <Button
                    type="button"
                    size="xs"
                    onClick={() => handleSendEmailVerificationCode(field.value)}
                    disabled={
                      !!fieldState.error ||
                      !field.value ||
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
            );
          }}
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
        <Controller
          name="password"
          control={control}
          render={({ field, fieldState }) => (
            <Input
              id="password"
              type="password"
              placeholder="비밀번호를 입력하세요."
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              state={fieldState.isTouched && fieldState.error ? 'error' : 'default'}
              message={fieldState.isTouched ? fieldState.error?.message : undefined}
              className="mb-2"
            />
          )}
        />
        <Controller
          name="confirmPassword"
          control={control}
          render={({ field, fieldState }) => (
            <Input
              id="confirmPassword"
              type="password"
              placeholder="비밀번호를 한 번 더 입력하세요."
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              state={fieldState.isTouched && fieldState.error ? 'error' : 'default'}
              message={fieldState.isTouched ? fieldState.error?.message : undefined}
              className="mb-2"
            />
          )}
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
            Boolean(errors.email || errors.password || errors.confirmPassword) ||
            !email ||
            !password ||
            !confirmPassword ||
            emailCodeVerifyStatus !== 'verified'
          }
        >
          다음
        </Button>
      </div>
    </form>
  );
};
