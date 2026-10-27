import { useMemo, useState } from 'react';

import type { InputState } from '@/components/ui/input';
import { isValidPassword } from '@/lib';
import usersService from '@/services/users';
import { useAuthStore } from '@/store/authStore';

type Feedback = { state: InputState; message?: string };
type Field = 'currentPassword' | 'newPassword' | 'confirmPassword';
type ServerError = { field: 'currentPassword' | null; message: string };

function useChangePasswordForm(onSuccess: () => void) {
  const token = useAuthStore((state) => state.token);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [touched, setTouched] = useState<Record<Field, boolean>>({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<ServerError | null>(null);

  const touch = (field: Field) => setTouched((prev) => ({ ...prev, [field]: true }));

  const currentPasswordFeedback: Feedback = useMemo(() => {
    if (currentPassword.trim() === '')
      return { state: 'error', message: '현재 비밀번호를 입력해 주세요.' };
    return { state: 'default' };
  }, [currentPassword]);

  const newPasswordFeedback: Feedback = useMemo(() => {
    if (newPassword.trim() === '')
      return { state: 'error', message: '새 비밀번호를 입력해 주세요.' };
    if (!isValidPassword(newPassword))
      return { state: 'error', message: '8~16자의 영문 대소문자, 숫자, 특수문자를 조합해 주세요.' };
    if (newPassword === currentPassword)
      return { state: 'error', message: '현재 비밀번호와 다른 비밀번호를 입력해 주세요.' };
    return { state: 'default' };
  }, [newPassword, currentPassword]);

  const confirmPasswordFeedback: Feedback = useMemo(() => {
    if (confirmPassword.trim() === '')
      return { state: 'error', message: '새 비밀번호를 한 번 더 입력해 주세요.' };
    if (newPassword !== confirmPassword)
      return { state: 'error', message: '비밀번호가 일치하지 않습니다.' };
    return { state: 'default' };
  }, [confirmPassword, newPassword]);

  const getFieldFeedback = (field: Field, feedback: Feedback): Feedback => {
    if (serverError?.field === field) return { state: 'error', message: serverError.message };
    return touched[field] ? feedback : { state: 'default' };
  };

  const canSubmit =
    currentPasswordFeedback.state === 'default' &&
    newPasswordFeedback.state === 'default' &&
    confirmPasswordFeedback.state === 'default' &&
    !isSubmitting;

  const handleSubmit = async () => {
    if (!token || !canSubmit) return;

    setServerError(null);
    setIsSubmitting(true);

    const result = await usersService.changePassword({ currentPassword, newPassword }, token);

    setIsSubmitting(false);

    if (result.isSuccess) {
      onSuccess();
      return;
    }

    if (result.statusCode === 400 && result.errorCode === 'INVALID_CURRENT_PASSWORD') {
      setServerError({ field: 'currentPassword', message: '현재 비밀번호가 일치하지 않아요.' });
      return;
    }

    if (result.statusCode === 400 && result.errorCode === 'PASSWORD_NOT_SET') {
      setServerError({
        field: null,
        message: '소셜 로그인 계정은 비밀번호를 변경할 수 없어요.',
      });
      return;
    }

    setServerError({
      field: null,
      message: '비밀번호 변경에 실패했어요. 잠시 후 다시 시도해주세요.',
    });
  };

  return {
    currentPassword: {
      value: currentPassword,
      onChange: (value: string) => {
        setCurrentPassword(value);
        setServerError(null);
      },
      onBlur: () => touch('currentPassword'),
      feedback: getFieldFeedback('currentPassword', currentPasswordFeedback),
    },
    newPassword: {
      value: newPassword,
      onChange: setNewPassword,
      onBlur: () => touch('newPassword'),
      feedback: getFieldFeedback('newPassword', newPasswordFeedback),
    },
    confirmPassword: {
      value: confirmPassword,
      onChange: setConfirmPassword,
      onBlur: () => touch('confirmPassword'),
      feedback: getFieldFeedback('confirmPassword', confirmPasswordFeedback),
    },
    submitErrorMessage: serverError?.field === null ? serverError.message : null,
    isSubmitting,
    canSubmit,
    handleSubmit,
  };
}

export default useChangePasswordForm;
