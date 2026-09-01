'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Maximize2,
  Minimize2,
  Trash2,
  TriangleAlert,
} from 'lucide-react';

import {
  cn,
  useLocalStorage,
  useMediaQuery,
  type LibraryEntryListItem,
  type LibraryEntryDetailItem,
  type LibraryEntryNotePatch,
  type ReadingStatus,
} from '@/lib';
import { Textarea, Button } from '@/components/ui';
import { Modal } from '@/components/layout';
import { StatusNotice } from '@/components/common';
import { useDialog } from '@/context/dialog';
import { useAuthStore } from '@/store/authStore';
import LibraryService from '@/services/library';

import { BookSummary } from './BookSummary';
import { RecordHeader } from './RecordHeader';
import { RecordSection } from './RecordSection';
import { RatingInput } from './RatingInput';
import { RatingStars } from './RatingStars';

const PANEL_DEFAULT_WIDTH = 672;
const PANEL_MIN_WIDTH = 400;
const PANEL_MAX_WIDTH_RATIO = 0.7;

export const PANEL_TRANSITION_MS = 300;

interface BookDetailAsideProps {
  item: LibraryEntryListItem;
  updateItem: (patch: LibraryEntryNotePatch) => Promise<boolean>;
  deleteItem: () => Promise<boolean>;
  isClosing: boolean;
  isEntering: boolean;
}

export const BookDetailAside = ({
  item,
  updateItem,
  deleteItem,
  isClosing,
  isEntering,
}: BookDetailAsideProps) => {
  const isMobile = !useMediaQuery('md');
  const [isFullscreen, setIsFullscreen] = useLocalStorage('notes-book-detail-fullscreen', false);
  const isFullscreenView = isMobile || isFullscreen;

  const [panelWidth, setPanelWidth] = useState(PANEL_DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    if (!isResizing) return;

    const maxWidth = window.innerWidth * PANEL_MAX_WIDTH_RATIO;

    const handleMouseMove = (e: MouseEvent) => {
      const nextWidth = window.innerWidth - e.clientX;
      setPanelWidth(Math.min(Math.max(nextWidth, PANEL_MIN_WIDTH), maxWidth));
    };
    const handleMouseUp = () => setIsResizing(false);

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  return (
    <div
      className={cn(
        'z-50 transition-all ease-in-out',
        isFullscreenView
          ? 'fixed inset-0'
          : 'fixed inset-0 md:sticky md:inset-auto md:top-0 md:h-screen md:w-(--panel-width) md:translate-x-0 md:self-start',
        !isFullscreenView && !isResizing && 'md:transition-[width]',
        !isFullscreenView && isResizing && 'transition-none',
        (isClosing || isEntering) && 'translate-x-full overflow-hidden',
      )}
      style={
        {
          '--panel-width': `${isClosing || isEntering ? 0 : panelWidth}px`,
          transitionDuration: `${PANEL_TRANSITION_MS}ms`,
        } as React.CSSProperties
      }
    >
      {!isFullscreenView && <ResizeHandle onResizeStart={() => setIsResizing(true)} />}
      <BookDetailPanel
        item={item}
        updateItem={updateItem}
        deleteItem={deleteItem}
        isFullscreen={isFullscreenView}
        showFullscreenToggle={!isMobile}
        onToggleFullscreen={() => setIsFullscreen(!isFullscreenView)}
      />
    </div>
  );
};

function ResizeHandle({ onResizeStart }: { onResizeStart: () => void }) {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="상세 패널 너비 조절"
      onMouseDown={(e) => {
        e.preventDefault();
        onResizeStart();
      }}
      className="hover:bg-primary/30 absolute top-0 left-0 z-10 hidden h-full w-1.5 -translate-x-1/2 cursor-col-resize transition-colors md:block"
    />
  );
}

function BookDetailPanel({
  item,
  updateItem,
  deleteItem,
  isFullscreen,
  showFullscreenToggle,
  onToggleFullscreen,
}: {
  item: LibraryEntryListItem;
  updateItem: (patch: LibraryEntryNotePatch) => Promise<boolean>;
  deleteItem: () => Promise<boolean>;
  isFullscreen: boolean;
  showFullscreenToggle: boolean;
  onToggleFullscreen: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { openDialog, closeDialog } = useDialog();

  const token = useAuthStore((state) => state.token);

  const [isEditing, setIsEditing] = useState(false);
  const [noteDraft, setNoteDraft] = useState<LibraryEntryDetailItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!token) return;

    setNoteDraft(null);
    setIsError(false);
    setIsLoading(true);
    LibraryService.getLibraryEntry(item.id, token).then((result) => {
      if (result.isSuccess) {
        setNoteDraft(result.data);
      } else {
        setIsError(true);
      }
      setIsLoading(false);
    });
  }, [item.id, token]);

  // rating/comment/note: 편집 중엔 로컬 state만 갱신, 저장 시점에만 한 번에 커밋한다.
  const handleUpdateNote = (patch: Pick<LibraryEntryNotePatch, 'rating' | 'comment' | 'note'>) => {
    setNoteDraft((current) => (current ? { ...current, ...patch } : current));
  };

  // TODO: notes/page에서 범용적으로 처리하는 건 어떨지 고민
  const showSaveErrorDialog = () => {
    openDialog(
      <Modal
        title={'저장에 실패했어요.\n잠시 후 다시 시도해주세요.'}
        buttons={[
          <Button key="close" onClick={closeDialog}>
            확인
          </Button>,
        ]}
        showCloseButton={false}
      />,
    );
  };

  // status/isPublic: 편집 모드와 무관한 독립 컨트롤이라 변경 즉시 커밋한다.
  const handleStatusChange = async (status: ReadingStatus) => {
    const success = await updateItem({ status });
    if (!success) showSaveErrorDialog();
  };

  const handleTogglePublic = async (nextIsPublic: boolean) => {
    if (!nextIsPublic) {
      const success = await updateItem({ isPublic: false });
      if (!success) showSaveErrorDialog();
      return;
    }

    openDialog(
      <Modal
        title="이 기록을 공개할까요?"
        content={'공개로 전환하면 다른 사용자도 이 기록을 볼 수 있어요.'}
        buttons={[
          <Button key="cancel" variant="outline" onClick={closeDialog}>
            취소
          </Button>,
          <Button
            key="confirm"
            onClick={async () => {
              closeDialog();
              const success = await updateItem({ isPublic: true });
              if (!success) showSaveErrorDialog();
            }}
          >
            공개
          </Button>,
        ]}
      />,
    );
  };

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

  const startEditing = () => {
    if (!noteDraft) return;
    setIsEditing(true);
  };

  const finishEditing = async () => {
    const patch: LibraryEntryNotePatch = {
      rating: noteDraft?.rating,
      comment: noteDraft?.comment,
      note: noteDraft?.note,
    };
    setIsSaving(true);
    const success = await updateItem(patch);
    setIsSaving(false);
    if (!success) {
      showSaveErrorDialog();
      return;
    }

    const now = new Date().toISOString();
    setNoteDraft((current) =>
      // TODO: 여기서 직접 updatedAt, createdAt 설정해도 문제 없나?
      current ? { ...current, updatedAt: now, createdAt: current.createdAt ?? now } : current,
    );
    setIsEditing(false);
  };

  return (
    <div className="border-primary/15 h-full w-full flex-col overflow-y-auto overscroll-contain border-l bg-white px-2 pt-3.5 pb-6 md:px-3.5 md:pt-5 md:pb-8">
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

      <div className="mx-auto w-full max-w-2xl min-w-2xs px-4">
        <BookSummary item={item} onStatusChange={handleStatusChange} />

        <div className="border-primary/20 mt-8 mb-6 flex flex-1 border-t" />

        <RecordPanel
          isLoading={isLoading}
          isError={isError}
          noteDraft={noteDraft}
          isEditing={isEditing}
          isSaving={isSaving}
          onToggleEdit={isEditing ? finishEditing : startEditing}
          isPublic={item.isPublic}
          onTogglePublic={handleTogglePublic}
          onUpdateNote={handleUpdateNote}
        />
      </div>
    </div>
  );
}

function DeleteConfirmModal({ onDelete }: { onDelete: () => Promise<boolean> }) {
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
}

interface RecordPanelProps {
  isLoading: boolean;
  isError: boolean;
  noteDraft: LibraryEntryDetailItem | null;
  isEditing: boolean;
  isSaving: boolean;
  onToggleEdit: () => void;
  isPublic: boolean;
  onTogglePublic: (isPublic: boolean) => void;
  onUpdateNote: (patch: Pick<LibraryEntryNotePatch, 'rating' | 'comment' | 'note'>) => void;
}

function RecordPanel({
  isLoading,
  isError,
  noteDraft,
  isEditing,
  isSaving,
  onToggleEdit,
  isPublic,
  onTogglePublic,
  onUpdateNote,
}: RecordPanelProps) {
  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-1.5">
        <LoaderCircle className="text-secondary size-6 animate-spin" strokeWidth={3} />
        <p className="text-secondary text-sm">불러오는 중...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <StatusNotice
        className="min-h-[60vh]"
        icon={
          <TriangleAlert className="text-primary size-14" strokeWidth={1.6} aria-hidden="true" />
        }
        title="상세 정보를 불러오지 못했어요"
        description="잠시 후 다시 시도해주세요."
      />
    );
  }

  return (
    <>
      <RecordHeader
        createdAt={noteDraft?.createdAt}
        updatedAt={noteDraft?.updatedAt}
        isEditing={isEditing}
        isSaving={isSaving}
        onToggleEdit={onToggleEdit}
        isPublic={isPublic}
        onTogglePublic={onTogglePublic}
      />

      <div className="flex flex-col gap-4">
        <RecordSection
          title="평점"
          isEditing={isEditing}
          hasValue={!!noteDraft?.rating}
          emptyMessage="아직 평점을 남기지 않았어요."
          editor={
            <RatingInput
              rating={noteDraft?.rating ?? 0}
              onChange={(rating) => onUpdateNote({ rating })}
            />
          }
          display={<RatingStars value={noteDraft?.rating ?? 0} />}
        />

        <RecordSection
          title="한줄평"
          isEditing={isEditing}
          hasValue={!!noteDraft?.comment}
          emptyMessage="아직 한줄평을 남기지 않았어요."
          editor={
            <Textarea
              value={noteDraft?.comment ?? ''}
              onChange={(e) => onUpdateNote({ comment: e.target.value })}
              placeholder="이 책에 대한 한줄평을 남겨보세요."
              maxLength={100}
              showCounter
            />
          }
          display={<p className="text-sm text-black">{noteDraft?.comment}</p>}
        />

        <RecordSection
          title="자유 기록"
          isEditing={isEditing}
          hasValue={!!noteDraft?.note}
          emptyMessage="아직 기록을 남기지 않았어요."
          editor={
            <Textarea
              value={noteDraft?.note ?? ''}
              onChange={(e) => onUpdateNote({ note: e.target.value })}
              placeholder="자유롭게 기록을 남겨보세요."
              className="flex-1"
              maxLength={2000}
              showCounter
            />
          }
          display={<p className="text-sm whitespace-pre-wrap text-black">{noteDraft?.note}</p>}
        />
      </div>
    </>
  );
}
