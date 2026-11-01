import { useState } from 'react';
import { toast } from 'sonner';

import type { Me } from '@/lib';
import usersService from '@/services/users';
import { useAuthStore } from '@/store/authStore';

type ConfirmMethod = 'password' | 'nickname';

function useDeleteAccountForm(user: Me) {
  const token = useAuthStore((state) => state.token);
  const clearToken = useAuthStore((state) => state.clearToken);
  const setUser = useAuthStore((state) => state.setUser);

  // 비밀번호 계정은 현재 비밀번호, 소셜 계정은 닉네임 입력으로 탈퇴 의사를 확인
  const confirmMethod: ConfirmMethod = user.hasPassword ? 'password' : 'nickname';

  const [confirmValue, setConfirmValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmErrorMessage, setConfirmErrorMessage] = useState<string | null>(null);
  const [submitErrorMessage, setSubmitErrorMessage] = useState<string | null>(null);

  const isConfirmValueValid =
    confirmMethod === 'password' ? confirmValue.length > 0 : confirmValue === user.nickname;
  const canSubmit = isConfirmValueValid && !isSubmitting;

  const handleConfirmValueChange = (value: string) => {
    setConfirmValue(value);
    setConfirmErrorMessage(null);
  };

  const handleSubmit = async () => {
    if (!token || !canSubmit) return;

    setConfirmErrorMessage(null);
    setSubmitErrorMessage(null);
    setIsSubmitting(true);

    const result = await usersService.deleteMe(
      confirmMethod === 'password' ? { password: confirmValue } : { nickname: confirmValue },
      token,
    );

    if (result.isSuccess) {
      // 이동은 AuthGuard 가 담당 (토큰이 사라지면 로그인 필수 라우트에서 redirectTo 로 replace)
      clearToken();
      toast('회원 탈퇴가 완료됐어요.');
      return;
    }

    if (result.statusCode === 400 && result.errorCode === 'NICKNAME_CONFIRM_MISMATCH') {
      // 화면의 확인 기준(닉네임, hasPassword)이 서버와 어긋난 상태이므로 최신 유저 정보로 갱신 후 다시 입력받음
      const me = await usersService.getMe(token);
      setIsSubmitting(false);
      if (me.isSuccess) {
        setUser(me.data);
        setConfirmValue('');
        setConfirmErrorMessage('계정 정보가 변경됐어요. 안내를 확인하고 다시 입력해 주세요.');
      } else {
        setConfirmErrorMessage('닉네임이 일치하지 않아요.');
      }
      return;
    }

    setIsSubmitting(false);

    if (result.statusCode === 400 && result.errorCode === 'INVALID_CURRENT_PASSWORD') {
      setConfirmErrorMessage('비밀번호가 일치하지 않아요.');
      return;
    }

    setSubmitErrorMessage('회원 탈퇴에 실패했어요. 잠시 후 다시 시도해주세요.');
  };

  return {
    confirmMethod,
    confirmValue,
    setConfirmValue: handleConfirmValueChange,
    confirmErrorMessage,
    submitErrorMessage,
    isSubmitting,
    canSubmit,
    handleSubmit,
  };
}

export default useDeleteAccountForm;
