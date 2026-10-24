'use client';

import { Container } from '@/components/layout';
import { useAuthStore } from '@/store/authStore';
import { AccountActionsSection } from './_components/AccountActionsSection';
import { AccountInfoSection } from './_components/AccountInfoSection';

export default function SettingsPage() {
  const user = useAuthStore((state) => state.user);

  if (!user) return null;

  return (
    <Container className="flex items-start justify-center">
      <div className="mt-16 flex w-full max-w-125 flex-col">
        <h1 className="mb-2 text-3xl font-bold">설정</h1>
        <p className="text-secondary mb-8 text-base">계정 정보를 확인하고 관리해요.</p>

        <AccountInfoSection user={user} />
        <AccountActionsSection showPasswordChange={user.hasPassword} />
      </div>
    </Container>
  );
}
