import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePathname, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, Minimize2, Maximize2, Trash2 } from 'lucide-react';

import { useDialog } from '@/context/dialog';
import { Modal } from '@/components/layout';
import { Button } from '@/components/ui';

interface PanelToolBarProps {
  isFullscreen: boolean;
  showFullscreenToggle: boolean;
  onToggleFullscreen: () => void;
  deleteItem: () => Promise<boolean>;
}

export const PanelToolBar = ({
  isFullscreen,
  showFullscreenToggle,
  onToggleFullscreen,
  deleteItem,
}: PanelToolBarProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { openDialog } = useDialog();

  const handleClose = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('item');
    if (params.size === 0) {
      router.push(pathname, { scroll: false });
      return;
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleDeleteClick = () => {
    openDialog(<DeleteConfirmModal onDelete={deleteItem} />);
  };

  return (
    <div className="mb-4 flex items-center gap-1">
      <button
        type="button"
        aria-label="상세 패널 닫기"
        onClick={handleClose}
        className="hover:bg-primary-foreground/50 flex size-9 cursor-pointer items-center justify-center rounded-full transition-colors"
      >
        {isFullscreen ? (
          <ChevronLeft className="size-5" aria-hidden="true" />
        ) : (
          <ChevronRight className="size-5" aria-hidden="true" />
        )}
      </button>
      {showFullscreenToggle && (
        <button
          type="button"
          aria-label={isFullscreen ? '전체화면 종료' : '전체화면으로 보기'}
          onClick={onToggleFullscreen}
          className="hover:bg-primary-foreground/50 flex size-9 cursor-pointer items-center justify-center rounded-full transition-colors"
        >
          {isFullscreen ? (
            <Minimize2 className="size-4" aria-hidden="true" />
          ) : (
            <Maximize2 className="size-4" aria-hidden="true" />
          )}
        </button>
      )}
      <button
        type="button"
        aria-label="서재에서 삭제"
        onClick={handleDeleteClick}
        className="hover:bg-destructive/10 text-destructive ml-auto flex size-9 cursor-pointer items-center justify-center rounded-full transition-colors"
      >
        <Trash2 className="size-4.5" aria-hidden="true" />
      </button>
    </div>
  );
};

const DeleteConfirmModal = ({ onDelete }: { onDelete: () => Promise<boolean> }) => {
  const { openDialog, closeDialog } = useDialog();
  const [isDeleting, setIsDeleting] = useState(false);

  return (
    <Modal
      title="정말 삭제할까요?"
      content={'이 작업은 되돌릴 수 없습니다.\n신중하게 진행해 주세요.'}
      buttons={[
        <Button key="cancel" variant="outline" disabled={isDeleting} onClick={closeDialog}>
          취소
        </Button>,
        <Button
          key="delete"
          variant="destructive"
          isLoading={isDeleting}
          onClick={async () => {
            setIsDeleting(true);
            const success = await onDelete();
            setIsDeleting(false);
            closeDialog();
            if (!success) {
              openDialog(
                <Modal
                  title={'삭제에 실패했어요.\n잠시 후 다시 시도해주세요.'}
                  buttons={[
                    <Button key="close" onClick={closeDialog}>
                      확인
                    </Button>,
                  ]}
                  showCloseButton={false}
                />,
              );
            }
          }}
        >
          삭제
        </Button>,
      ]}
      showCloseButton={false}
    />
  );
};
