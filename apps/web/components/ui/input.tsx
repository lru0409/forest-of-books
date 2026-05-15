'use client';

import * as React from 'react';
import { Eye, EyeOff, X } from 'lucide-react';

import { cn } from '@/lib/utils';

type InputState = 'default' | 'info' | 'error';

const stateInputStyles: Record<InputState, string> = {
  default: 'border-input focus-visible:border-primary disabled:bg-input/50',
  info: 'border-input focus-visible:border-primary disabled:bg-input/50',
  error:
    'border-destructive focus-visible:border-destructive focus-visible:ring-1 focus-visible:ring-destructive',
};

const messageStyles: Record<InputState, string> = {
  default: '',
  info: 'text-gray-500',
  error: 'text-destructive',
};

interface InputProps extends React.ComponentProps<'input'> {
  clearable?: boolean;
  state?: InputState;
  message?: string | null;
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
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = React.useState(false);

  const isPassword = type === 'password';
  const hasRightButtons = clearable || isPassword;
  const hasTwoButtons = clearable && isPassword;

  const handleClear = () => {
    onChange?.({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>);
  };

  return (
    <div className={cn('w-full', className)}>
      <div className="relative">
        <input
          type={isPassword ? (showPassword ? 'text' : 'password') : type}
          data-slot="input"
          value={value}
          maxLength={maxLength}
          onChange={onChange}
          aria-invalid={state === 'error' || undefined}
          className={cn(
            'file:text-foreground placeholder:text-muted-foreground caret-primary h-8 w-full min-w-0 rounded-xl border bg-white px-4 py-6 text-base text-black transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-1 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
            hasRightButtons && (hasTwoButtons ? 'pr-20' : 'pr-11'),
            stateInputStyles[state],
          )}
          {...props}
        />
        {!props.disabled && (
          <div className="absolute top-1/2 right-4.5 flex -translate-y-1/2 items-center gap-2.5">
            {clearable && value && (
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
          </div>
        )}
      </div>
      {message && <p className={cn('mt-1.5 text-sm', messageStyles[state])}>{message}</p>}
    </div>
  );
}

export { Input };
