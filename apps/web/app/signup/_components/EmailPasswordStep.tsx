'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Step } from '../constants';
import { Button, Input } from '@/components/ui';
import { useSignupStore } from '@/store/signupStore';
import useEmailPasswordStep from '../_hooks/useEmaillPasswordStep';

export const EmailPasswordStep = () => {
  const router = useRouter();
  const {
    update,
    email: defaultEmail,
    password: defaultPassword,
    confirmPassword: defaultConfirmPassword,
  } = useSignupStore();

  const [email, setEmail] = useState(defaultEmail);
  const [emailVerificationCode, setEmailVerificationCode] = useState('');
  const [password, setPassword] = useState(defaultPassword);
  const [confirmPassword, setConfirmPassword] = useState(defaultConfirmPassword);
  const [touched, setTouched] = useState({
    email: false,
    password: false,
    confirmPassword: false,
  });

  const {
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
  } = useEmailPasswordStep(email, emailVerificationCode, password, confirmPassword);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
            setEmailVerificationCode('');
            resetEmailVerification();
          }}
          onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
          readOnly={emailCodeSendStatus === 'sending' || emailCodeVerifyStatus === 'verifying'}
          state={touched.email ? emailFeedback.state : 'default'}
          message={touched.email ? emailFeedback.message : undefined}
          suffix={
            <Button
              type="button"
              size="xs"
              onClick={() => {
                setEmailVerificationCode('');
                handleSendEmailVerificationCode();
              }}
              disabled={!canSendEmailCode}
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
              emailCodeVerifyStatus === 'verified'
            }
            state={emailCodeFeedback.state}
            message={emailCodeFeedback.message}
            suffix={
              <Button
                type="button"
                size="xs"
                onClick={() => handleVerifyEmailCode()}
                disabled={!canVerifyEmailCode}
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
