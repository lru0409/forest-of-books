'use client';

import { useState } from 'react';

import { useDialog } from '@/context/dialog';
import { Modal } from '@/components/layout';
import { Button } from '@/components/ui';

function StepModal({ depth }: { depth: number }) {
  const { openDialog, closeDialog, closeAllDialogs } = useDialog();
  const [count, setCount] = useState(0);

  return (
    <Modal
      title={`${depth}번째 모달`}
      content={
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm">카운트: {count} (다음 모달에 갔다 와도 유지돼요)</p>
          <Button variant="outline" size="sm" onClick={() => setCount((prev) => prev + 1)}>
            +1
          </Button>
        </div>
      }
      buttons={[
        <Button key="next" variant="outline" onClick={() => openDialog(<StepModal depth={depth + 1} />)}>
          다음 모달 열기
        </Button>,
        <Button key="back" onClick={closeDialog}>
          {depth === 1 ? '닫기' : '이전으로'}
        </Button>,
        <Button key="all" variant="destructive" onClick={closeAllDialogs}>
          모두 닫기
        </Button>,
      ]}
      buttonLayout="vertical"
    />
  );
}

function ProfileFormModal() {
  const { openDialog, closeDialog, closeAllDialogs } = useDialog();

  return (
    <Modal
      title="프로필 수정"
      content={
        <label className="flex flex-col gap-1 text-sm">
          닉네임 (입력 후 저장을 눌렀다가 돌아와도 유지돼요)
          <input
            className="rounded-md border px-3 py-2 text-sm outline-none"
            defaultValue="lru0409"
          />
        </label>
      }
      buttons={[
        <Button key="cancel" variant="outline" onClick={closeDialog}>
          취소
        </Button>,
        <Button
          key="save"
          onClick={() =>
            openDialog(
              <Modal
                title="정말 저장할까요?"
                showCloseButton={false}
                buttons={[
                  <Button key="back" variant="outline" onClick={closeDialog}>
                    돌아가기
                  </Button>,
                  <Button key="confirm" onClick={closeAllDialogs}>
                    저장
                  </Button>,
                ]}
              />,
            )
          }
        >
          저장
        </Button>,
      ]}
    />
  );
}

function LongListModal() {
  const { openDialog, closeDialog } = useDialog();

  return (
    <Modal
      title="긴 목록 (스크롤 위치 유지 확인)"
      content={
        <div className="flex flex-col gap-2">
          <div className="max-h-60 overflow-y-auto rounded-md border">
            {Array.from({ length: 40 }, (_, i) => (
              <p key={i} className="border-b px-3 py-2 text-sm last:border-b-0">
                항목 {i + 1}
              </p>
            ))}
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() =>
              openDialog(
                <Modal
                  title={'요청에 실패했어요.\n잠시 후 다시 시도해주세요.'}
                  showCloseButton={false}
                  buttons={[
                    <Button key="ok" onClick={closeDialog}>
                      확인
                    </Button>,
                  ]}
                />,
              )
            }
          >
            실패 다이얼로그 띄우기
          </Button>
        </div>
      }
      buttons={[
        <Button key="close" onClick={closeDialog}>
          닫기
        </Button>,
      ]}
    />
  );
}

export default function DialogTestPage() {
  const { openDialog, closeDialog } = useDialog();

  const stackCases = [
    { label: '스택: 모달 여러 개 연달아 열기 (카운트 유지)', open: () => openDialog(<StepModal depth={1} />) },
    { label: '스택: 폼 위에 확인 모달 (입력값 유지)', open: () => openDialog(<ProfileFormModal />) },
    { label: '스택: 긴 목록 위에 실패 모달 (스크롤 유지)', open: () => openDialog(<LongListModal />) },
  ];

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

      <h2 className="mt-6 text-lg font-semibold">모달 스택 샘플</h2>
      {stackCases.map(({ label, open }) => (
        <Button key={label} onClick={open}>
          {label}
        </Button>
      ))}
    </div>
  );
}
