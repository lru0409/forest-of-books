'use client';

import Link from 'next/link';

import { useSignupStore } from '@/store/signupStore';

export function SignupLink() {
  const { reset } = useSignupStore();
  return (
    <Link href="/signup" className="hover:underline" onClick={reset}>
      회원가입
    </Link>
  );
}
