'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

import { Container, Modal } from '@/components/layout';
import { Button, Input } from '@/components/ui';
import { useDialog } from '@/context/dialog';
import { useAuthStore } from '@/store/authStore';
import useChangePasswordForm from './useChangePasswordForm';

export default function ChangePasswordPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const hasPassword = user?.hasPassword;

  useEffect(() => {
    if (hasPassword === false) router.replace('/settings');
  }, [hasPassword, router]);

  if (!hasPassword) return null;
  return <ChangePasswordForm />;
}

function ChangePasswordForm() {
  const router = useRouter();
  const { openDialog, closeDialog } = useDialog();

  const handleSuccess = () => {
    openDialog(
      <Modal
        title="비밀번호가 변경됐어요."
        buttons={[
          <Button
            key="confirm"
            onClick={() => {
              closeDialog();
              router.replace('/settings');
            }}
          >
            확인
          </Button>,
        ]}
        showCloseButton={false}
        preventClose
      />,
    );
  };

  const {
    currentPassword,
    newPassword,
    confirmPassword,
    submitErrorMessage,
    isSubmitting,
    canSubmit,
    handleSubmit,
  } = useChangePasswordForm(handleSuccess);

  return (
    <Container className="flex items-start justify-center" showBottomNav={false}>
      <div className="relative mt-16 flex min-h-[calc(100%-4rem)] w-full max-w-125 flex-col">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-secondary hover:text-primary absolute -top-9.5 left-0 flex cursor-pointer items-center gap-0.5 text-sm font-medium transition-colors"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          돌아가기
        </button>

        <h1 className="mb-2 text-3xl font-bold">비밀번호 변경</h1>
        <p className="text-secondary mb-8 text-base">현재 비밀번호를 확인한 뒤 변경해요.</p>

        <form
          className="flex flex-1 flex-col justify-between"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <div>
            <label htmlFor="currentPassword" className="mb-2 block text-lg font-semibold">
              현재 비밀번호
            </label>
            <Input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              placeholder="현재 비밀번호를 입력하세요."
              value={currentPassword.value}
              onChange={(e) => currentPassword.onChange(e.target.value)}
              onBlur={currentPassword.onBlur}
              state={currentPassword.feedback.state}
              message={currentPassword.feedback.message}
              className="mb-6"
            />

            <label htmlFor="newPassword" className="mb-1 block text-lg font-semibold">
              새 비밀번호
            </label>
            <p className="text-secondary mb-2 text-sm">
              * 8~16자의 영문 대소문자, 숫자, 특수문자 조합
            </p>
            <Input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              placeholder="새 비밀번호를 입력하세요."
              value={newPassword.value}
              onChange={(e) => newPassword.onChange(e.target.value)}
              onBlur={newPassword.onBlur}
              state={newPassword.feedback.state}
              message={newPassword.feedback.message}
              className="mb-2"
            />
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="새 비밀번호를 한 번 더 입력하세요."
              aria-label="새 비밀번호 확인"
              value={confirmPassword.value}
              onChange={(e) => confirmPassword.onChange(e.target.value)}
              onBlur={confirmPassword.onBlur}
              state={confirmPassword.feedback.state}
              message={confirmPassword.feedback.message}
              className="mb-2"
            />
          </div>

          <div className="mt-10">
            {submitErrorMessage && (
              <p className="text-destructive mb-4 text-sm">{submitErrorMessage}</p>
            )}
            <Button type="submit" className="w-full" disabled={!canSubmit} isLoading={isSubmitting}>
              변경하기
            </Button>
          </div>
        </form>
      </div>
    </Container>
  );
}
