import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { type LibraryEntryListItem, type LibraryEntryNotePatch } from '@/lib';
import LibraryService from '@/services/library';

function useLibrary({ userId, token }: { userId?: string; token: string | null }) {
  const router = useRouter();
  const pathname = usePathname();

  const [items, setItems] = useState<LibraryEntryListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!userId || !token) return;

    setIsLoading(true);
    setIsError(false);
    LibraryService.getUserLibrary(userId, token).then((result) => {
      if (result.isSuccess) {
        setItems(result.data);
      } else {
        setIsError(true);
      }
      setIsLoading(false);
    });
  }, [userId, token]);

  const updateItem = useCallback(
    async (itemId: string, patch: LibraryEntryNotePatch): Promise<boolean> => {
      if (!token) return false;

      // 목록에 보이는 필드만 낙관적으로 반영, 실패하면 롤백한다.
      const listPatch: Partial<Pick<LibraryEntryListItem, 'status' | 'color' | 'isPublic'>> = {};
      if ('status' in patch) listPatch.status = patch.status;
      if ('color' in patch) listPatch.color = patch.color;
      if ('isPublic' in patch) listPatch.isPublic = patch.isPublic;
      const hasListPatch = Object.keys(listPatch).length > 0;

      const previousItems = items;
      if (hasListPatch) {
        setItems((current) =>
          current.map((item) => (item.id === itemId ? { ...item, ...listPatch } : item)),
        );
      }

      const result = await LibraryService.updateEntry(itemId, patch, token);
      if (!result.isSuccess) {
        if (hasListPatch) setItems(previousItems);
        return false;
      }
      return true;
    },
    [items, token],
  );

  const deleteItem = useCallback(
    async (itemId: string): Promise<boolean> => {
      if (!token) return false;

      // 삭제는 성공 확인 후에만 목록에서 제거한다.
      const result = await LibraryService.deleteEntry(itemId, token);
      if (!result.isSuccess) return false;

      setItems((current) => current.filter((item) => item.id !== itemId));
      router.push(pathname, { scroll: false });
      return true;
    },
    [pathname, router, token],
  );

  return {
    items,
    isLoading,
    isError,
    updateItem,
    deleteItem,
  };
}

export default useLibrary;
