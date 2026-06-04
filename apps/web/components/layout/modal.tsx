import { type ReactNode } from 'react';
import {
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type ModalProps = {
  title: string;
  content?: string | ReactNode;
  buttons: ReactNode[];
  showCloseButton?: boolean;
  buttonLayout?: 'horizontal' | 'vertical';
};

export function Modal({
  title,
  content,
  buttons,
  showCloseButton = true,
  buttonLayout = 'horizontal',
}: ModalProps) {
  return (
    <DialogContent showCloseButton={showCloseButton}>
      <div className="flex flex-col items-center gap-5">
        <DialogTitle
          className={cn(
            'text-center font-semibold whitespace-pre-wrap',
            showCloseButton ? 'mx-8' : 'mx-2',
            content ? 'mt-2 text-xl' : 'mt-5 text-lg',
          )}
        >
          {title}
        </DialogTitle>
        {content &&
          (typeof content === 'string' ? (
            <DialogDescription className="text-lg whitespace-pre-wrap">{content}</DialogDescription>
          ) : (
            <div className="w-full">{content}</div>
          ))}
      </div>
      <DialogFooter
        className={cn(
          buttonLayout === 'horizontal'
            ? 'flex-row gap-2 [&>*]:flex-1'
            : 'flex-col gap-2 [&>*]:w-full',
        )}
      >
        {buttons.map((button) => button)}
      </DialogFooter>
    </DialogContent>
  );
}
