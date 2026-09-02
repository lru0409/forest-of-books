import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { type LibraryEntryListItem } from '@/lib';
import { PANEL_TRANSITION_MS } from '../_components';

function useSelectedLibraryItem(items: LibraryEntryListItem[]) {
  const searchParams = useSearchParams();
  const selectedItemId = searchParams.get('item');

  const [selectedItem, setSelectedItem] = useState<LibraryEntryListItem | undefined>(undefined);
  const [isClosing, setIsClosing] = useState(false);
  const [isEntering, setIsEntering] = useState(false);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    const selectedItem = selectedItemId ? items.find((item) => item.id === selectedItemId) : null;
    if (selectedItem) {
      const isNewlyOpening = !wasOpenRef.current;
      setSelectedItem(selectedItem);
      setIsClosing(false);
      wasOpenRef.current = true;

      if (isNewlyOpening) {
        setIsEntering(true);
        const timer = setTimeout(() => setIsEntering(false), 20);
        return () => clearTimeout(timer);
      }
    } else if (wasOpenRef.current) {
      wasOpenRef.current = false;
      setIsClosing(true);
      const timer = setTimeout(() => setSelectedItem(undefined), PANEL_TRANSITION_MS);
      return () => clearTimeout(timer);
    }
  }, [selectedItemId, items]);

  return {
    selectedItem,
    isClosing,
    isEntering,
  };
}

export default useSelectedLibraryItem;
