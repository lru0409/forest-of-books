'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

import { Container } from '@/components/layout/container';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const TOTAL_STEPS = 3;

enum Step {
  EMAIL_PASSWORD = 1,
  PROFILE = 2,
  GENRES = 3,
}

export default function SignUpPage() {
  return (
    <Suspense>
      <SignUp />
    </Suspense>
  );
}

function SignUp() {
  const searchParams = useSearchParams();
  const step: Step = Math.max(1, Math.min(TOTAL_STEPS, Number(searchParams.get('step') ?? '1')));

  return (
    <>
      <ProgressBar step={step} total={TOTAL_STEPS} />
      <Container className="flex flex-col pt-12 pb-10">
        {step === Step.EMAIL_PASSWORD && <EmailPasswordStep />}
        {step === Step.PROFILE && <ProfileStep />}
        {step === Step.GENRES && <GenresStep />}
      </Container>
    </>
  );
}

// TODO: 세부 입력에 따라 업데이트
const ProgressBar = ({ step, total }: { step: number; total: number }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="bg-secondary/50 fixed top-0 right-0 left-0 h-2">
      <div
        className="bg-primary h-full transition-all duration-500 ease-in-out"
        style={{ width: mounted ? `${(step / total) * 100}%` : '0%' }}
      />
    </div>
  );
};

const EmailPasswordStep = () => {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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
          className="mb-2"
        />
        <Input
          type="password"
          placeholder="비밀번호를 한 번 더 입력하세요."
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>
      <Button onClick={() => router.push(`/signup?step=${Step.PROFILE}`)}>다음</Button>
    </div>
  );
};

const ProfileStep = () => {
  const router = useRouter();

  const [nickname, setNickname] = useState('');
  const [bio, setBio] = useState('');

  return (
    <div className="flex flex-1 flex-col justify-between">
      <div>
        <h1 className="mb-2 text-3xl font-bold">프로필 설정하기</h1>
        <p className="text-secondary mb-8 text-base">
          다른 유저에게 보여질 프로필을 완성해 주세요.
        </p>

        <label htmlFor="nickname" className="mb-1 block text-lg font-semibold">
          닉네임
        </label>
        <p className="text-secondary mb-2 text-sm">* 2~12자의 한글, 영문, 숫자</p>
        <Input
          id="nickname"
          type="text"
          placeholder="닉네임을 입력하세요."
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          className="mb-5"
        />

        <label htmlFor="bio" className="mb-1 block text-lg font-semibold">
          자기소개
        </label>
        <p className="text-secondary mb-2.5 text-sm">가입 후 언제든지 수정할 수 있어요.</p>
        <Textarea
          id="bio"
          placeholder="소설책이나 철학책을 즐겨읽어요!"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="mb-5"
        />

        <label htmlFor="profileImage" className="mb-1 block text-lg font-semibold">
          프로필 이미지
        </label>
        <p className="text-secondary mb-4 text-sm">
          기본 프로필 이미지 중 선택하거나 직접 업로드할 수 있어요.
        </p>

        <div className="mb-14 flex flex-col items-center">
          <div className="bg-secondary/20 border-border mb-4 h-35 w-35 rounded-full border-2" />
          <Button size="sm" className="mb-2 w-50">
            기본 프로필 이미지 선택
          </Button>
          <Button size="sm" variant="outline" className="w-50">
            직접 업로드
          </Button>
        </div>
      </div>
      <Button onClick={() => router.push(`/signup?step=${Step.GENRES}`)}>다음</Button>
    </div>
  );
};

const GENRES = [
  '소설',
  '시',
  '에세이',
  '인문',
  '사회·정치',
  '경제·경영',
  '자기계발',
  '과학·기술',
  '역사',
  '예술·문화',
  '여행',
  '아동·청소년',
  '만화',
];

const GenresStep = () => {
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  const toggle = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre],
    );
  };

  return (
    <div className="flex flex-1 flex-col justify-between">
      <div>
        <h1 className="mb-2 text-3xl font-bold">선호 장르</h1>
        <p className="text-secondary mb-8 text-base">좋아하는 장르를 선택해 주세요.</p>

        <div className="flex flex-wrap gap-2">
          {GENRES.map((genre) => (
            <Button
              key={genre}
              size="sm"
              onClick={() => toggle(genre)}
              variant={selectedGenres.includes(genre) ? 'default' : 'outline'}
              className={cn('px-3 py-1.5 transition-colors')}
            >
              {genre}
            </Button>
          ))}
        </div>
      </div>
      <Button onClick={() => console.log('완료')}>완료</Button>
    </div>
  );
};
