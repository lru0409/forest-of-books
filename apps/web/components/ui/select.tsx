'use client';

import * as React from 'react';
import { Select as SelectPrimitive } from 'radix-ui';
import { Check, ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';

type SelectState = 'default' | 'info' | 'error' | 'success';

const stateStyles: Record<SelectState, string> = {
  default: 'border-input data-[state=open]:border-primary data-[state=open]:ring-1',
  info: 'border-input data-[state=open]:border-primary data-[state=open]:ring-1',
  error:
    'border-destructive data-[state=open]:border-destructive data-[state=open]:ring-1 data-[state=open]:ring-destructive',
  success: 'border-input data-[state=open]:border-primary data-[state=open]:ring-1',
};

function Select({ ...props }: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />;
}

function SelectValue({ ...props }: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />;
}

function SelectTrigger({
  className,
  children,
  state = 'default',
  emphasizeOpenState = true,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  state?: SelectState;
  emphasizeOpenState?: boolean;
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      aria-invalid={state === 'error' || undefined}
      className={cn(
        'group flex h-8 w-full cursor-pointer items-center justify-between gap-2 rounded-xl border bg-white px-4 py-6 text-base outline-none disabled:cursor-not-allowed disabled:opacity-50',
        '[&[data-placeholder]]:text-muted-foreground',
        emphasizeOpenState && stateStyles[state],
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown
          className="size-4 shrink-0 text-current transition-transform duration-200 group-data-[state=open]:rotate-180"
          aria-hidden="true"
        />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

function SelectContent({
  className,
  children,
  position = 'popper',
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        position={position}
        className={cn(
          'bg-popover text-popover-foreground border-primary/15 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 z-50 min-w-[var(--radix-select-trigger-width)] rounded-lg border shadow-lg duration-100',
          position === 'popper' &&
            'data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1',
          className,
        )}
        {...props}
      >
        <SelectPrimitive.Viewport className="flex max-h-96 flex-col gap-1 overflow-y-auto p-1">
          {children}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

function SelectItem({
  className,
  children,
  interactive = true,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item> & { interactive?: boolean }) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        'group text-primary flex w-full cursor-pointer items-center justify-between gap-2 rounded-md px-2.5 py-2 text-sm font-semibold',
        interactive && 'data-highlighted:bg-muted data-[state=checked]:bg-primary/10',
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator>
        <Check className="size-4 text-current" strokeWidth={3} aria-hidden="true" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}

export { Select, SelectValue, SelectTrigger, SelectContent, SelectItem };
