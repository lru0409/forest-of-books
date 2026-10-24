'use client';

import { useRouter } from 'next/navigation';

import { useAuthStore } from '@/store/authStore';
import { SettingsMenu, SettingsMenuItem } from './SettingsMenu';

interface AccountActionsSectionProps {
  showPasswordChange: boolean;
}

export function AccountActionsSection({ showPasswordChange }: AccountActionsSectionProps) {
  const router = useRouter();
  const clearToken = useAuthStore((state) => state.clearToken);

  const handleLogout = () => {
    clearToken();
    router.push('/');
  };

  return (
    <section className="mb-10">
      <h2 className="mb-3 text-lg font-semibold">계정 관리</h2>
      <SettingsMenu>
        {showPasswordChange && (
          <SettingsMenuItem title="비밀번호 변경" href="/settings/password" disabled />
        )}
        <SettingsMenuItem title="로그아웃" onClick={handleLogout} />
        <SettingsMenuItem
          title="회원 탈퇴"
          description="탈퇴하면 계정과 모든 기록이 삭제돼요."
          tone="destructive"
          href="/settings/withdraw"
          disabled
        />
      </SettingsMenu>
    </section>
  );
}
