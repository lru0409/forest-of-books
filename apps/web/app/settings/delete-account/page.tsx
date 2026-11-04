'use client';

import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  NotebookPen,
  TriangleAlert,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react';

import { Container, Modal } from '@/components/layout';
import { Button, Input } from '@/components/ui';
import { useDialog } from '@/context/dialog';
import { type Me } from '@/lib';
import { useAuthStore } from '@/store/authStore';
import useDeleteAccountForm from './useDeleteAccountForm';

const DELETED_ITEMS: { icon: LucideIcon; label: string }[] = [
  { icon: UserRound, label: '계정과 프로필 정보' },
  { icon: NotebookPen, label: '서재에 등록한 독서 노트(별점 · 한줄평 · 자유기록)' },
  { icon: Users, label: '팔로우 관계' },
];

export default function DeleteAccountPage() {
  const user = useAuthStore((state) => state.user);

  if (!user) return null;
  return <DeleteAccountForm user={user} />;
}

function DeleteAccountForm({ user }: { user: Me }) {
  const router = useRouter();
  const { openDialog, closeDialog } = useDialog();

  const {
    confirmMethod,
    confirmValue,
    setConfirmValue,
    confirmErrorMessage,
    submitErrorMessage,
    isSubmitting,
    canSubmit,
    handleSubmit,
  } = useDeleteAccountForm(user);

  const openConfirmModal = () => {
    openDialog(
      <Modal
        title="정말 탈퇴할까요?"
        content={'탈퇴하면 계정과 모든 기록이\n삭제되고 되돌릴 수 없어요.'}
        buttons={[
          <Button key="cancel" variant="outline" onClick={closeDialog}>
            취소
          </Button>,
          <Button
            key="confirm"
            variant="destructive"
            onClick={() => {
              closeDialog();
              handleSubmit();
            }}
          >
            탈퇴하기
          </Button>,
        ]}
        showCloseButton={false}
      />,
    );
  };

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

        <h1 className="mb-2 text-3xl font-bold">회원 탈퇴</h1>
        <p className="text-secondary mb-8 text-base">탈퇴하기 전에 아래 내용을 확인해 주세요.</p>

        <form
          className="flex flex-1 flex-col justify-between"
          onSubmit={(e) => {
            e.preventDefault();
            if (canSubmit) openConfirmModal();
          }}
        >
          <div>
            <section
              aria-labelledby="deleteWarningTitle"
              className="border-destructive/20 bg-destructive/5 mb-8 rounded-2xl border px-6 py-5"
            >
              <div className="mb-4 flex items-center gap-3">
                <span className="bg-destructive/10 text-destructive flex size-9 shrink-0 items-center justify-center rounded-full">
                  <TriangleAlert className="size-5 -translate-y-px" aria-hidden="true" />
                </span>
                <h2
                  id="deleteWarningTitle"
                  className="text-destructive text-base font-semibold break-keep"
                >
                  탈퇴하면 아래 정보가 모두 삭제돼요.
                </h2>
              </div>
              <ul className="flex flex-col">
                {DELETED_ITEMS.map(({ icon: Icon, label }) => (
                  <li key={label} className="text-md flex items-center gap-3 break-keep text-black">
                    <span className="flex size-9 shrink-0 items-center justify-center">
                      <Icon className="text-destructive size-4.5" aria-hidden="true" />
                    </span>
                    {label}
                  </li>
                ))}
              </ul>
              <p className="text-md text-destructive mt-3 font-medium">
                삭제된 정보는 복구할 수 없어요.
              </p>
            </section>

            {confirmMethod === 'password' ? (
              <>
                <label htmlFor="confirmValue" className="mb-2 block text-lg font-semibold">
                  현재 비밀번호
                </label>
                <Input
                  id="confirmValue"
                  type="password"
                  autoComplete="current-password"
                  placeholder="현재 비밀번호를 입력하세요."
                  value={confirmValue}
                  onChange={(e) => setConfirmValue(e.target.value)}
                  state={confirmErrorMessage ? 'error' : 'default'}
                  message={confirmErrorMessage}
                />
              </>
            ) : (
              <>
                <label htmlFor="confirmValue" className="mb-1 block text-lg font-semibold">
                  닉네임 확인
                </label>
                <p className="text-secondary mb-2 text-sm">
                  * 확인을 위해 닉네임을 똑같이 입력해 주세요. (
                  <strong className="text-primary">{user.nickname}</strong>)
                </p>
                <Input
                  id="confirmValue"
                  type="text"
                  autoComplete="off"
                  placeholder="닉네임을 입력하세요."
                  value={confirmValue}
                  onChange={(e) => setConfirmValue(e.target.value)}
                  state={confirmErrorMessage ? 'error' : 'default'}
                  message={confirmErrorMessage}
                />
              </>
            )}
          </div>

          <div className="mt-10">
            {submitErrorMessage && (
              <p className="text-destructive mb-4 text-sm">{submitErrorMessage}</p>
            )}
            <Button
              type="submit"
              variant="destructive"
              className="w-full"
              disabled={!canSubmit}
              isLoading={isSubmitting}
            >
              탈퇴하기
            </Button>
          </div>
        </form>
      </div>
    </Container>
  );
}
