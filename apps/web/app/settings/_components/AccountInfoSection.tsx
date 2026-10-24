import { type LoginProvider, type Me, formatDate, getLoginProvider } from '@/lib';

const LOGIN_PROVIDER_LABELS: Record<LoginProvider, string> = {
  EMAIL: '이메일로 로그인',
  KAKAO: '카카오 소셜 로그인',
  GOOGLE: '구글 소셜 로그인',
  NAVER: '네이버 소셜 로그인',
};

export function AccountInfoSection({ user }: { user: Me }) {
  const rows = [
    { label: '이메일', value: user.email ?? '—' },
    { label: '로그인 방식', value: LOGIN_PROVIDER_LABELS[getLoginProvider(user)] },
    { label: '가입일', value: formatDate(user.createdAt) },
  ];

  return (
    <section className="mb-10">
      <h2 className="mb-3 text-lg font-semibold">계정 정보</h2>
      <dl className="flex flex-col gap-3 text-sm">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex justify-between gap-4">
            <dt className="text-secondary shrink-0">{label}</dt>
            <dd className="font-medium break-all">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
