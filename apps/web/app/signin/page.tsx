import Link from 'next/link';
import Image from 'next/image';

import { Container } from '@/components/layout/container';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function SignIn() {
  return (
    <Container className="flex flex-col justify-center">
      {/* 브랜드 */}
      <h1 className="mb-14 text-center text-5xl font-bold">책의 숲</h1>

      {/* 로그인 폼 */}
      <Input type="text" placeholder="이메일을 입력하세요." className="mb-3" />
      <Input type="password" placeholder="비밀번호를 입력하세요." className="mb-7" />
      <Button className="mb-6 w-full">로그인</Button>

      <div className="mx-auto mb-20 flex gap-4">
        <Link href="/forgot-password" className="hover:underline">
          비밀번호 찾기
        </Link>
        |
        <Link href="/signup" className="hover:underline">
          회원가입
        </Link>
      </div>

      {/* 소셜 로그인 구분선 */}
      <div className="relative mb-7 flex items-center">
        <div className="bg-border h-px flex-1" />
        <span className="bg-background absolute left-1/2 -translate-x-1/2 px-2.5 text-base whitespace-nowrap">
          소셜 계정으로 로그인
        </span>
      </div>

      {/* 소셜 로그인 버튼 */}
      <div className="flex justify-center gap-4.5">
        <Image src="/naver-login.png" alt="네이버로 로그인" width={52} height={52} />
        <Image src="/kakao-login.png" alt="카카오로 로그인" width={52} height={52} />
        <Image src="/google-login.png" alt="구글로 로그인" width={52} height={52} />
      </div>
    </Container>
  );
}
