'use client';

import { useCallback, useMemo, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

import { Modal } from '@/components/layout';
import { Button } from '@/components/ui';
import { useDialog } from '@/context/dialog';

import { savePostLoginRedirect } from '../post-login-redirect';

export function useCommonDialog() {
  const router = useRouter();
  const { openDialog, closeDialog } = useDialog();

  const openAlert = useCallback(
    (title: string, buttons?: ReactNode[], content?: string) => {
      openDialog(
        <Modal
          title={title}
          content={content}
          buttons={
            buttons ?? [
              <Button key="close" onClick={closeDialog}>
                확인
              </Button>,
            ]
          }
          showCloseButton={false}
        />,
      );
    },
    [openDialog, closeDialog],
  );

  const showLoginRequired = useCallback(() => {
    openAlert('로그인이 필요해요.', [
      <Button
        key="signin"
        onClick={() => {
          closeDialog();
          savePostLoginRedirect();
          router.push('/signin');
        }}
      >
        로그인하러 가기
      </Button>,
    ]);
  }, [openAlert, closeDialog, router]);

  // action: '좋아요', '저장' 처럼 실패한 동작 이름. 없으면 일반 오류 문구를 보여준다.
  const showActionFailed = useCallback(
    (action?: string) =>
      openAlert(
        `${action ? `${action}에 실패했어요.` : '오류가 발생했어요.'}\n잠시 후 다시 시도해주세요.`,
      ),
    [openAlert],
  );

  const showUnavailableNote = useCallback(
    () => openAlert('비공개로 전환되었거나 삭제된 노트예요.'),
    [openAlert],
  );

  const showUserNotFound = useCallback(
    (onConfirm?: () => void) =>
      openAlert('존재하지 않는 사용자예요.', [
        <Button
          key="close"
          onClick={() => {
            closeDialog();
            onConfirm?.();
          }}
        >
          확인
        </Button>,
      ]),
    [openAlert, closeDialog],
  );

  return useMemo(
    () => ({ showLoginRequired, showActionFailed, showUnavailableNote, showUserNotFound }),
    [showLoginRequired, showActionFailed, showUnavailableNote, showUserNotFound],
  );
}
