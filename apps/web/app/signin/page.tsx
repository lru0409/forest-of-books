'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

import { Container, Modal } from '@/components/layout';
import { Button, Input } from '@/components/ui';
import { useDialog } from '@/context/dialog';
import { isValidEmail } from '@/lib';
import AuthService from '@/services/auth';
import { useAuthStore } from '@/store/authStore';
import { SignupLink } from './_components/SignupLink';

export default function SignIn() {
  const router = useRouter();
  const setToken = useAuthStore((state) => state.setToken);
  const { openDialog, closeDialog } = useDialog();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);
    setLoginError(null);

    if (!isValidEmail(email)) {
      setEmailError('올바른 이메일 형식을 입력해 주세요.');
      return;
    }

    setIsSubmitting(true);
    const result = await AuthService.login(email, password);
    setIsSubmitting(false);

    if (result.isSuccess) {
      setToken(result.data.token);
      router.push('/');
      return;
    }
    if (result.statusCode === 401) {
      setLoginError('이메일 또는 비밀번호가 올바르지 않습니다.');
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

  return (
    <Container className="flex min-h-170 w-full justify-center">
      <div className="flex w-125 min-w-80 flex-col justify-center">
        {/* 브랜드 */}
        <h1 className="mb-14 text-center text-5xl font-bold">책의 숲</h1>

        {/* 로그인 폼 */}
        <form onSubmit={handleLogin}>
          <Input
            type="text"
            placeholder="이메일을 입력하세요."
            className="mb-3"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailError(null);
              setLoginError(null);
            }}
            state={emailError || loginError ? 'error' : 'default'}
            message={emailError ?? undefined}
          />
          <Input
            type="password"
            placeholder="비밀번호를 입력하세요."
            className="mb-7"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setLoginError(null);
            }}
            state={loginError ? 'error' : 'default'}
            message={loginError ?? undefined}
          />
          <Button
            type="submit"
            className="mb-6 w-full"
            isLoading={isSubmitting}
            disabled={!email || !password}
          >
            로그인
          </Button>
        </form>

        <div className="mx-auto mb-20 flex gap-4 text-lg">
          <Link href="/forgot-password" className="hover:underline">
            비밀번호 찾기
          </Link>
          |
          <SignupLink />
        </div>

        {/* 소셜 로그인 구분선 */}
        <div className="relative mb-8 flex items-center">
          <div className="bg-border h-px flex-1" />
          <span className="bg-background absolute left-1/2 -translate-x-1/2 px-2.5 text-lg whitespace-nowrap">
            소셜 계정으로 로그인
          </span>
        </div>

        {/* 소셜 로그인 버튼 */}
        <div className="flex justify-center gap-4.5">
          <a href={`${process.env.NEXT_PUBLIC_API_URL}/auth/naver`}>
            <Image
              src="/images/social-login/naver.png"
              alt="네이버로 로그인"
              width={52}
              height={52}
            />
          </a>
          <a href={`${process.env.NEXT_PUBLIC_API_URL}/auth/kakao`}>
            <Image
              src="/images/social-login/kakao.png"
              alt="카카오로 로그인"
              width={52}
              height={52}
            />
          </a>
          <a href={`${process.env.NEXT_PUBLIC_API_URL}/auth/google`}>
            <Image
              src="/images/social-login/google.png"
              alt="구글로 로그인"
              width={52}
              height={52}
            />
          </a>
        </div>
      </div>
    </Container>
  );
}
