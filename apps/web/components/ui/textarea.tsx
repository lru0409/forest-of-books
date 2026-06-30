'use client';

import { useState, type ChangeEvent, type ComponentProps } from 'react';

import { cn } from '@/lib/utils';

export type TextareaState = 'default' | 'info' | 'error';

const stateStyles: Record<TextareaState, string> = {
  default: 'border-input focus-visible:border-primary disabled:bg-input/50',
  info: 'border-input focus-visible:border-primary disabled:bg-input/50',
  error:
    'border-destructive focus-visible:border-destructive focus-visible:ring-1 focus-visible:ring-destructive',
};

const messageStyles: Record<TextareaState, string> = {
  default: 'text-muted-foreground',
  info: 'text-gray-500',
  error: 'text-destructive',
};

interface TextareaProps extends ComponentProps<'textarea'> {
  state?: TextareaState;
  message?: string | null;
  warnLength?: number;
  showCounter?: boolean;
}

function Textarea({
  className,
  maxLength = 255,
  warnLength,
  showCounter = false,
  value,
  onChange,
  state = 'default',
  message,
  ...props
}: TextareaProps) {
  const isControlled = value !== undefined;
  const [internalLength, setInternalLength] = useState(
    props.defaultValue !== undefined ? String(props.defaultValue).length : 0,
  );

  const currentLength = isControlled ? String(value).length : internalLength;

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    if (!isControlled) setInternalLength(e.target.value.length);
    onChange?.(e);
  };

  return (
    <div className={cn('w-full', className)}>
      <textarea
        data-slot="textarea"
        aria-invalid={state === 'error' || undefined}
        className={cn(
          'placeholder:text-muted-foreground flex field-sizing-content min-h-24 w-full rounded-xl border bg-white px-4 pt-3 pb-3.5 text-base transition-colors outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50',
          stateStyles[state],
        )}
        maxLength={maxLength}
        value={value}
        onChange={handleChange}
        {...props}
      />
      <div className="mt-1 flex items-start justify-between gap-2">
        {message ? <p className={cn('text-sm', messageStyles[state])}>{message}</p> : <span />}
        {showCounter && (
          <p className={cn('shrink-0 text-xs', messageStyles[state])}>
            {currentLength}/{warnLength ?? maxLength}
          </p>
        )}
      </div>
    </div>
  );
}

export { Textarea };
