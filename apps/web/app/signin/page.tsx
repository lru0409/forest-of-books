import Link from 'next/link';
import Image from 'next/image';

import { Container } from '@/components/layout';
import { Button, Input } from '@/components/ui';

export default function SignIn() {
  return (
    <Container className="flex min-h-170 w-full justify-center">
      <div className="flex w-125 min-w-80 flex-col justify-center">
        {/* 브랜드 */}
        <h1 className="mb-14 text-center text-5xl font-bold">책의 숲</h1>

        {/* 로그인 폼 */}
        <Input type="text" placeholder="이메일을 입력하세요." className="mb-3" />
        <Input type="password" placeholder="비밀번호를 입력하세요." className="mb-7" />
        <Button className="mb-6 w-full">로그인</Button>

        <div className="mx-auto mb-20 flex gap-4 text-lg">
          <Link href="/forgot-password" className="hover:underline">
            비밀번호 찾기
          </Link>
          |
          <Link href="/signup" className="hover:underline">
            회원가입
          </Link>
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
