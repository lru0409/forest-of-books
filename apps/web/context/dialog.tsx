'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Dialog } from '@/components/ui/dialog';

type DialogContextValue = {
  openDialog: (content: ReactNode) => void;
  closeDialog: () => void;
  closeAllDialogs: () => void;
};

interface DialogEntry {
  id: number;
  content: ReactNode;
}

const DialogContext = createContext<DialogContextValue | null>(null);

export function DialogProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<DialogEntry[]>([]);
  const nextIdRef = useRef(0);

  const openDialog = useCallback((content: ReactNode) => {
    const id = nextIdRef.current++;
    setStack((prev) => [...prev, { id, content }]);
  }, []);

  const closeDialog = useCallback(() => setStack((prev) => prev.slice(0, -1)), []);

  const closeAllDialogs = useCallback(() => setStack([]), []);

  const closeEntry = (id: number) => setStack((prev) => prev.filter((entry) => entry.id !== id));

  const value = useMemo(
    () => ({ openDialog, closeDialog, closeAllDialogs }),
    [openDialog, closeDialog, closeAllDialogs],
  );

  return (
    <DialogContext.Provider value={value}>
      {children}
      {stack.map((entry, index) => (
        <Dialog
          key={entry.id}
          open
          isActive={index === stack.length - 1}
          isBase={index === 0}
          onOpenChange={(open) => !open && closeEntry(entry.id)}
        >
          {entry.content}
        </Dialog>
      ))}
    </DialogContext.Provider>
  );
}

export function useDialog(): DialogContextValue {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useDialog must be used within DialogProvider');
  return ctx;
}
