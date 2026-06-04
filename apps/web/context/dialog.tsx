'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import { Dialog } from '@/components/ui/dialog';

type DialogContextValue = {
  openDialog: (content: ReactNode) => void;
  closeDialog: () => void;
};

const DialogContext = createContext<DialogContextValue | null>(null);

export function DialogProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<ReactNode | null>(null);

  const openDialog = (content: ReactNode) => setContent(content);
  const closeDialog = () => setContent(null);

  return (
    <DialogContext.Provider value={{ openDialog, closeDialog }}>
      {children}
      <Dialog open={!!content} onOpenChange={(open) => !open && setContent(null)}>
        {content}
      </Dialog>
    </DialogContext.Provider>
  );
}

export function useDialog(): DialogContextValue {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useDialog must be used within DialogProvider');
  return ctx;
}
