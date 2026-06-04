'use client';

import { useDialog } from '@/context/dialog';
import { Modal } from '@/components/layout';
import { Button } from '@/components/ui';

export default function DialogTestPage() {
  const { openDialog, closeDialog } = useDialog();

  const cases = [
    {
      label: 'only title + use close button + 1 button',
      open: () =>
        openDialog(
          <Modal
            title={'인증이 만료되었습니다.\n다시 소셜 로그인을 시도해주세요.'}
            buttons={[
              <Button key="confirm" onClick={closeDialog}>
                확인
              </Button>,
            ]}
          />,
        ),
    },
    {
      label: 'only title + 1 button',
      open: () =>
        openDialog(
          <Modal
            title={'인증이 만료되었습니다.\n다시 소셜 로그인을 시도해주세요.'}
            showCloseButton={false}
            buttons={[
              <Button key="confirm" onClick={closeDialog}>
                확인
              </Button>,
            ]}
          />,
        ),
    },
    {
      label: 'title and description + use close button + 2 vertical buttons',
      open: () =>
        openDialog(
          <Modal
            title={'정말 삭제할까요?'}
            content={'이 작업은 되돌릴 수 없습니다.\n신중하게 진행해 주십시오.'}
            buttons={[
              <Button key="cancel" variant="outline" onClick={closeDialog}>
                취소
              </Button>,
              <Button key="delete" variant="destructive" onClick={closeDialog}>
                삭제
              </Button>,
            ]}
            buttonLayout="vertical"
          />,
        ),
    },
    {
      label: 'title and description + 2 horizontal buttons',
      open: () =>
        openDialog(
          <Modal
            title={'정말 삭제할까요?'}
            showCloseButton={false}
            content={'이 작업은 되돌릴 수 없습니다.\n신중하게 진행해 주십시오.'}
            buttons={[
              <Button key="cancel" variant="outline" onClick={closeDialog}>
                취소
              </Button>,
              <Button key="delete" variant="destructive" onClick={closeDialog}>
                삭제
              </Button>,
            ]}
            buttonLayout="horizontal"
          />,
        ),
    },
    {
      label: 'title and custom content + use close button + 2 horizontal buttons',
      open: () =>
        openDialog(
          <Modal
            title="프로필 수정"
            content={
              <div className="flex flex-col gap-3">
                <label className="flex flex-col gap-1 text-sm">
                  닉네임
                  <input
                    className="rounded-md border px-3 py-2 text-sm outline-none"
                    defaultValue="lru0409"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  한줄 소개
                  <textarea
                    className="rounded-md border px-3 py-2 text-sm outline-none"
                    rows={3}
                    defaultValue="책 읽는 개발자"
                  />
                </label>
              </div>
            }
            buttons={[
              <Button key="cancel" variant="outline" onClick={closeDialog}>
                취소
              </Button>,
              <Button key="save" onClick={closeDialog}>
                저장
              </Button>,
            ]}
          />,
        ),
    },
  ];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="mb-4 text-xl font-semibold">Dialog 테스트</h1>
      {cases.map(({ label, open }) => (
        <Button key={label} variant="outline" onClick={open}>
          {label}
        </Button>
      ))}
    </div>
  );
}
