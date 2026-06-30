'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Modal } from '@/components/layout';
import { Button } from '@/components/ui';
import { useDialog } from '@/context/dialog';
import type { Genre } from '@/lib';
import AuthService from '@/services/auth';
import { useAuthStore } from '@/store/authStore';
import { useSignupStore } from '@/store/signupStore';
import { Step } from '../constants';

function useRegistration() {
  const router = useRouter();
  const { openDialog, closeDialog } = useDialog();

  const { email, password, nickname, bio, profileImageUrl, isSocialLogin, update } =
    useSignupStore();
  const { setToken } = useAuthStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const progressResolveRef = useRef<(() => void) | null>(null);

  const handleProgressComplete = () => {
    progressResolveRef.current?.();
  };

  const openSocialLoginExpiredDialog = () => {
    openDialog(
      <Modal
        title={'소셜 로그인 세션이 만료되었어요.\n소셜 로그인부터 다시 시작해 주세요.'}
        buttons={[
          <Button
            key="login"
            onClick={() => {
              router.push('/signin');
              closeDialog();
            }}
          >
            로그인으로 이동
          </Button>,
        ]}
        showCloseButton={false}
      />,
    );
  };

  const openNicknameAlreadyExistsDialog = () => {
    openDialog(
      <Modal
        title={'이미 사용 중인 닉네임이에요.\n다른 닉네임을 입력해 주세요.'}
        buttons={[
          <Button
            key="nickname"
            onClick={() => {
              update({ nicknameVerified: false });
              router.push(`/signup?step=${Step.PROFILE}`);
              closeDialog();
            }}
          >
            닉네임 다시 입력하기
          </Button>,
        ]}
        showCloseButton={false}
      />,
    );
  };

  const handleSubmit = async (genres: Genre[]) => {
    setIsSubmitting(true);
    const progressPromise = new Promise<void>((resolve) => {
      progressResolveRef.current = resolve;
    });
    const commonPayload = { nickname, bio, profileImageUrl, preferredGenres: genres };
    const apiPromise = isSocialLogin
      ? AuthService.socialRegister(commonPayload)
      : AuthService.generalRegister({ email, password, ...commonPayload });
    // api 응답 수신 && progress bar 끝까지 진행 -> 이후 액션 수행
    const [result] = await Promise.all([apiPromise, progressPromise]);
    setIsSubmitting(false);

    if (result.isSuccess) {
      setToken(result.data.token);
      router.push('/signup/complete');
      return;
    }
    // 소셜 로그인 pending token 만료
    if (isSocialLogin && result.statusCode === 401) {
      openSocialLoginExpiredDialog();
      return;
    }
    // 닉네임 중복
    if (result.statusCode === 409 && result.errorCode === 'NICKNAME_ALREADY_EXISTS') {
      openNicknameAlreadyExistsDialog();
      return;
    }
    // unknown error
    openDialog(
      <Modal
        title={'오류가 발생했습니다.\n잠시 후 다시 시도해주세요.'}
        buttons={[
          <Button key="close" onClick={closeDialog}>
            확인
          </Button>,
        ]}
        showCloseButton={false}
      />,
    );
  };

  return {
    handleSubmit,
    isSubmitting,
    handleProgressComplete,
  };
}

export default useRegistration;
