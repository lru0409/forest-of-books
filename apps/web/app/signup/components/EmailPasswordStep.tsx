'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { validateEmail, validatePassword } from '@/lib/validations';
import { Step } from '../constants';

export const EmailPasswordStep = () => {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [touched, setTouched] = useState({ email: false, password: false, confirmPassword: false });

  const touch = (field: keyof typeof touched) => setTouched((prev) => ({ ...prev, [field]: true }));

  const emailErrorMessage = (() => {
    if (!email) return '이메일을 입력해 주세요.';
    if (!validateEmail(email)) return '올바른 이메일 형식을 입력해 주세요.';
    return null;
  })();

  const passwordErrorMessage = (() => {
    if (!password) return '비밀번호를 입력해 주세요.';
    if (!validatePassword(password))
      return '8~16자의 영문 대소문자, 숫자, 특수문자를 조합해 주세요.';
    return null;
  })();

  const confirmPasswordErrorMessage = (() => {
    if (!confirmPassword) return '비밀번호를 한 번 더 입력해 주세요.';
    if (password !== confirmPassword) return '비밀번호가 일치하지 않습니다.';
    return null;
  })();

  return (
    <div className="flex flex-1 flex-col justify-between">
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
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => touch('email')}
          state={touched.email && emailErrorMessage ? 'error' : 'default'}
          message={touched.email ? emailErrorMessage : undefined}
          className="mb-5"
        />

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
          onBlur={() => touch('password')}
          state={touched.password && passwordErrorMessage ? 'error' : 'default'}
          message={touched.password ? passwordErrorMessage : undefined}
          className="mb-2"
        />
        <Input
          type="password"
          placeholder="비밀번호를 한 번 더 입력하세요."
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          onBlur={() => touch('confirmPassword')}
          state={touched.confirmPassword && confirmPasswordErrorMessage ? 'error' : 'default'}
          message={touched.confirmPassword ? confirmPasswordErrorMessage : undefined}
        />
      </div>
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={() => router.back()}>
          돌아가기
        </Button>
        <Button
          className="flex-1"
          disabled={Boolean(
            emailErrorMessage || passwordErrorMessage || confirmPasswordErrorMessage,
          )}
          onClick={() => router.push(`/signup?step=${Step.PROFILE}`)}
        >
          다음
        </Button>
      </div>
    </div>
  );
};
