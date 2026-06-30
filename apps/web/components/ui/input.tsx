'use client';

import * as React from 'react';
import { Eye, EyeOff, X } from 'lucide-react';

import { cn } from '@/lib/utils';

export type InputState = 'default' | 'info' | 'error' | 'success';

const stateWrapperStyles: Record<InputState, string> = {
  default: 'border-input focus-within:border-primary focus-within:ring-1',
  info: 'border-input focus-within:border-primary focus-within:ring-1',
  error:
    'border-destructive focus-within:border-destructive focus-within:ring-1 focus-within:ring-destructive',
  success: 'border-input focus-within:border-primary focus-within:ring-1',
};

const messageStyles: Record<InputState, string> = {
  default: '',
  info: 'text-gray-500',
  error: 'text-destructive',
  success: 'text-green-600',
};

interface InputProps extends React.ComponentProps<'input'> {
  clearable?: boolean;
  state?: InputState;
  message?: string | null;
  suffix?: React.ReactNode;
}

function Input({
  className,
  type,
  clearable = true,
  state = 'default',
  message,
  onChange,
  value,
  maxLength = 255,
  suffix,
  ...props
}: InputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [showPassword, setShowPassword] = React.useState(false);

  const isPassword = type === 'password';

  const handleClear = () => {
    onChange?.({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>);
  };

  // TODO: 이거 꼭 해야하나?
  const hasRightContent =
    !props.disabled && (suffix || isPassword || (clearable && !props.readOnly && value));

  return (
    <div className={cn('w-full', className)}>
      <div
        onClick={() => inputRef.current?.focus()}
        className={cn(
          'flex h-8 w-full items-center rounded-xl border bg-white px-4 py-6',
          stateWrapperStyles[state],
          'has-[input:disabled]:bg-input/20 has-[input:disabled]:cursor-not-allowed has-[input:disabled]:opacity-50',
        )}
      >
        <input
          type={isPassword ? (showPassword ? 'text' : 'password') : type}
          ref={inputRef}
          data-slot="input"
          value={value}
          maxLength={maxLength}
          onChange={onChange}
          aria-invalid={state === 'error' || undefined}
          className={cn(
            'file:text-foreground placeholder:text-muted-foreground caret-primary min-w-0 flex-1 text-base text-black transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed',
            hasRightContent && 'pr-2',
          )}
          {...props}
        />
        {hasRightContent && (
          <div className="flex shrink-0 items-center gap-2.5">
            {clearable && !props.readOnly && value && (
              <button
                type="button"
                onClick={handleClear}
                className="flex size-4 cursor-pointer items-center justify-center rounded-full bg-stone-400 text-white"
                aria-label="입력 내용 지우기"
                disabled={props.disabled}
                tabIndex={-1}
              >
                <X className="size-3" strokeWidth={4} />
              </button>
            )}
            {isPassword && (
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="text-stone-400"
                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 표시'}
                disabled={props.disabled}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="size-5.5" strokeWidth={2} />
                ) : (
                  <Eye className="size-5.5" strokeWidth={2} />
                )}
              </button>
            )}
            {suffix}
          </div>
        )}
      </div>
      {message && <p className={cn('mt-1.5 text-sm', messageStyles[state])}>{message}</p>}
    </div>
  );
}

export { Input };
