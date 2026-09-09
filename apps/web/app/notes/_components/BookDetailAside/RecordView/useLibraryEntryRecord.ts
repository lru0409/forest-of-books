import { useState, useEffect } from 'react';

import { type LibraryEntryDetailItem, type LibraryEntryNotePatch } from '@/lib';

function useLibraryEntryRecord({
  detail,
  updateItem,
}: {
  detail: LibraryEntryDetailItem | null;
  updateItem: (patch: LibraryEntryNotePatch) => Promise<boolean>;
}) {
  const [noteDraft, setNoteDraft] = useState<LibraryEntryDetailItem | null>(detail);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setNoteDraft(detail);
    setIsEditing(false);
  }, [detail]);

  // rating/comment/note: 편집 중엔 로컬 state만 갱신, 저장 시점에만 한 번에 커밋한다.
  const updateNoteDraft = (patch: Pick<LibraryEntryNotePatch, 'rating' | 'comment' | 'note'>) => {
    setNoteDraft((current) => (current ? { ...current, ...patch } : current));
  };

  const startEditing = () => {
    setIsEditing(true);
  };

  const finishEditing = async (): Promise<boolean> => {
    const patch: LibraryEntryNotePatch = {
      rating: noteDraft?.rating,
      comment: noteDraft?.comment,
      note: noteDraft?.note,
    };
    setIsSaving(true);
    const success = await updateItem(patch);
    setIsSaving(false);
    if (!success) return false;

    const now = new Date().toISOString();
    setNoteDraft((current) =>
      current ? { ...current, updatedAt: now, createdAt: current.createdAt ?? now } : current,
    );
    setIsEditing(false);
    return true;
  };

  return {
    noteDraft,
    isEditing,
    isSaving,
    updateNoteDraft,
    startEditing,
    finishEditing,
  };
}

export default useLibraryEntryRecord;
