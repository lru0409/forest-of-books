import { useState, useEffect } from 'react';

import { type LibraryEntryDetailItem, type LibraryEntryNotePatch } from '@/lib';
import LibraryService from '@/services/library';

function useLibraryEntryRecord({
  itemId,
  token,
  updateItem,
}: {
  itemId: string;
  token: string | null;
  updateItem: (patch: LibraryEntryNotePatch) => Promise<boolean>;
}) {
  const [noteDraft, setNoteDraft] = useState<LibraryEntryDetailItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!token) return;

    setNoteDraft(null);
    setIsError(false);
    setIsLoading(true);
    LibraryService.getLibraryEntry(itemId, token).then((result) => {
      if (result.isSuccess) {
        setNoteDraft(result.data);
      } else {
        setIsError(true);
      }
      setIsLoading(false);
    });
  }, [itemId, token]);

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
    isLoading,
    isError,
    isEditing,
    isSaving,
    updateNoteDraft,
    startEditing,
    finishEditing,
  };
}

export default useLibraryEntryRecord;
