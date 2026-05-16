'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button, Input } from '@/components/ui';
import { emailPasswordSchema, type EmailPasswordFormData } from '../schemas';
import { useSignupStore } from '@/store/signupStore';
import { Step } from '../constants';

export const EmailPasswordStep = () => {
  const router = useRouter();
  const setStepData = useSignupStore((s) => s.setEmailPasswordStep);
  const defaultEmail = useSignupStore((s) => s.email);
  const defaultPassword = useSignupStore((s) => s.password);
  const defaultConfirmPassword = useSignupStore((s) => s.confirmPassword);

  const {
    control,
    handleSubmit,
    watch,
    trigger,
    getFieldState,
    formState: { errors },
  } = useForm<EmailPasswordFormData>({
    resolver: zodResolver(emailPasswordSchema),
    mode: 'onTouched',
    defaultValues: {
      email: defaultEmail,
      password: defaultPassword,
      confirmPassword: defaultConfirmPassword,
    },
  });

  const password = watch('password');
  useEffect(
    function validateConfirmPasswordOnPasswordChange() {
      if (getFieldState('password').isTouched) {
        trigger('confirmPassword');
      }
    },
    [password, trigger, getFieldState],
  );

  const onSubmit = (data: EmailPasswordFormData) => {
    setStepData(data);
    router.push(`/signup?step=${Step.PROFILE}`);
  };

  return (
    <form className="flex flex-1 flex-col justify-between" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <h1 className="mb-2 text-3xl font-bold">계정 만들기</h1>
        <p className="text-secondary mb-8 text-base">이메일과 비밀번호를 입력해 주세요.</p>

        <label htmlFor="email" className="mb-2 block text-lg font-semibold">
          이메일
        </label>
        <Controller
          name="email"
          control={control}
          render={({ field, fieldState }) => (
            <Input
              id="email"
              type="email"
              placeholder="이메일을 입력하세요."
              value={field.value}
              maxLength={254}
              onChange={field.onChange}
              onBlur={field.onBlur}
              state={fieldState.isTouched && fieldState.error ? 'error' : 'default'}
              message={fieldState.isTouched ? fieldState.error?.message : undefined}
              className="mb-5"
            />
          )}
        />

        <label htmlFor="password" className="mb-1 block text-lg font-semibold">
          비밀번호
        </label>
        <p className="text-secondary mb-2 text-sm">* 8~16자의 영문 대소문자, 숫자, 특수문자 조합</p>
        <Controller
          name="password"
          control={control}
          render={({ field, fieldState }) => (
            <Input
              id="password"
              type="password"
              placeholder="비밀번호를 입력하세요."
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              state={fieldState.isTouched && fieldState.error ? 'error' : 'default'}
              message={fieldState.isTouched ? fieldState.error?.message : undefined}
              className="mb-2"
            />
          )}
        />
        <Controller
          name="confirmPassword"
          control={control}
          render={({ field, fieldState }) => (
            <Input
              id="confirmPassword"
              type="password"
              placeholder="비밀번호를 한 번 더 입력하세요."
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              state={fieldState.isTouched && fieldState.error ? 'error' : 'default'}
              message={fieldState.isTouched ? fieldState.error?.message : undefined}
              className="mb-2"
            />
          )}
        />
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}>
          돌아가기
        </Button>
        <Button
          type="submit"
          className="flex-1"
          disabled={Boolean(errors.email || errors.password || errors.confirmPassword)}
        >
          다음
        </Button>
      </div>
    </form>
  );
};
