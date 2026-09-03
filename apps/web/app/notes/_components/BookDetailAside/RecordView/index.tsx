import { type ReactNode } from 'react';
import { LoaderCircle, TriangleAlert } from 'lucide-react';

import { type LibraryEntryNotePatch } from '@/lib';
import { StatusNotice } from '@/components/common';
import { Textarea, Button } from '@/components/ui';
import { Modal } from '@/components/layout';
import { useDialog } from '@/context/dialog';
import { useAuthStore } from '@/store/authStore';
import useLibraryEntryRecord from './useLibraryEntryRecord';

import { RecordHeader } from './RecordHeader';
import { RatingInput } from './RatingInput';
import { RatingStars } from './RatingStars';

interface RecordViewProps {
  itemId: string;
  updateItem: (patch: LibraryEntryNotePatch) => Promise<boolean>;
  isPublic: boolean;
}

export const RecordView = ({ itemId, updateItem, isPublic }: RecordViewProps) => {
  const { openDialog, closeDialog } = useDialog();
  const token = useAuthStore((state) => state.token);

  const {
    noteDraft,
    isLoading,
    isError,
    isEditing,
    isSaving,
    updateNoteDraft,
    startEditing,
    finishEditing,
  } = useLibraryEntryRecord({ itemId, token, updateItem });

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

  const onTogglePublic = async (nextIsPublic: boolean) => {
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

  const onToggleEdit = async () => {
    if (!isEditing) {
      startEditing();
      return;
    }
    const success = await finishEditing();
    if (!success) showSaveErrorDialog();
  };

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
              onChange={(rating) => updateNoteDraft({ rating })}
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
              onChange={(e) => updateNoteDraft({ comment: e.target.value })}
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
              onChange={(e) => updateNoteDraft({ note: e.target.value })}
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
};

interface RecordSectionProps {
  title: string;
  isEditing: boolean;
  hasValue: boolean;
  emptyMessage: string;
  editor: ReactNode;
  display: ReactNode;
}

export function RecordSection({
  title,
  isEditing,
  hasValue,
  emptyMessage,
  editor,
  display,
}: RecordSectionProps) {
  return (
    <section className="border-primary/20 rounded-xl border p-5">
      <h4 className="text-primary mb-2 text-base font-medium">{title}</h4>
      {isEditing ? (
        editor
      ) : hasValue ? (
        display
      ) : (
        <p className="text-secondary text-sm">{emptyMessage}</p>
      )}
    </section>
  );
}
