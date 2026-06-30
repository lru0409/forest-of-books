import { useState, useMemo } from 'react';

import authService from '@/services/auth';
import { PROFILE_IMAGE_ACCEPTED_TYPES, PROFILE_IMAGE_MAX_FILE_SIZE } from '../constants';
import type { InputState } from '@/components/ui/input';
import type { TextareaState } from '@/components/ui/textarea';
import { useSignupStore } from '@/store/signupStore';

type NicknameCheckStatus = 'idle' | 'checking' | 'available' | 'unavailable' | 'error';

function useProfileStep(nickname: string, bio: string) {
  const { nicknameVerified: defaultNicknameVerified, profileImageUrl, update } = useSignupStore();

  const [nicknameCheckStatus, setNicknameCheckStatus] = useState<NicknameCheckStatus>(
    defaultNicknameVerified ? 'available' : 'idle',
  );

  const [displayProfileImageUrl, setDisplayProfileImageUrl] = useState<string>(profileImageUrl);
  const [profileImageErrorMessage, setProfileImageErrorMessage] = useState<string | null>(null);
  const [isProfileImageUploading, setIsProfileImageUploading] = useState(false);

  // TODO: 유틸 함수 사용
  const isNicknameValid = nickname && /^[가-힣a-zA-Z0-9]{2,12}$/.test(nickname);
  const nicknameFeedback: { state: InputState; message?: string } = useMemo(() => {
    if (!nickname) return { state: 'error', message: '닉네임을 입력해 주세요.' };
    if (!isNicknameValid)
      return { state: 'error', message: '2~12자의 한글, 영문, 숫자만 입력해 주세요.' };
    switch (nicknameCheckStatus) {
      case 'available':
        return { state: 'success', message: '사용 가능한 닉네임이에요.' };
      case 'unavailable':
        return { state: 'error', message: '이미 사용 중인 닉네임이에요.' };
      case 'error':
        return { state: 'error', message: '오류가 발생했어요. 나중에 다시 시도해주세요.' };
      case 'checking':
      case 'idle':
        return { state: 'default' };
    }
  }, [nickname, isNicknameValid, nicknameCheckStatus]);

  const bioFeedback: { state: TextareaState; message?: string } = useMemo(() => {
    if (bio.length > 160) return { state: 'error', message: '최대 160자까지 입력할 수 있어요.' };
    return { state: 'default' };
  }, [bio]);

  const resetNicknameCheck = () => {
    setNicknameCheckStatus('idle');
  };

  const handleCheckNickname = async (nickname: string) => {
    setNicknameCheckStatus('checking');
    let nextStatus: NicknameCheckStatus = 'error';

    try {
      const result = await authService.checkNickname(nickname);
      if (result.isSuccess) {
        nextStatus = result.data.available ? 'available' : 'unavailable';
      }
    } catch {
      nextStatus = 'error';
    } finally {
      setNicknameCheckStatus(nextStatus);
    }
  };

  const handleSelectDefaultImage = (index: number) => {
    if (displayProfileImageUrl && displayProfileImageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(displayProfileImageUrl);
    }
    const url = `${process.env.NEXT_PUBLIC_BASE_URL}/images/profile-defaults/${index + 1}.png`;
    setDisplayProfileImageUrl(url);
    update({ profileImageUrl: url });
  };

  const handleProfileImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!PROFILE_IMAGE_ACCEPTED_TYPES.includes(file.type)) {
      setProfileImageErrorMessage('JPG, PNG, WEBP, GIF 형식만 업로드할 수 있어요.');
      return;
    }
    if (file.size > PROFILE_IMAGE_MAX_FILE_SIZE) {
      setProfileImageErrorMessage('5MB 이하의 파일만 업로드할 수 있어요.');
      return;
    }

    setProfileImageErrorMessage(null);
    setIsProfileImageUploading(true);

    const prevDisplayImageUrl = displayProfileImageUrl;
    const nextDisplayImageUrl = URL.createObjectURL(file);
    setDisplayProfileImageUrl(nextDisplayImageUrl);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const result = await authService.uploadProfileImage(formData);
      if (result.isSuccess) {
        if (prevDisplayImageUrl.startsWith('blob:')) {
          URL.revokeObjectURL(prevDisplayImageUrl);
        }
        update({ profileImageUrl: result.data.url });
        return;
      }
    } catch {
      setProfileImageErrorMessage('프로필 이미지 업로드에 실패했어요. 나중에 다시 시도해주세요.');
      URL.revokeObjectURL(nextDisplayImageUrl);
      setDisplayProfileImageUrl(prevDisplayImageUrl);
    } finally {
      setIsProfileImageUploading(false);
      e.target.value = '';
    }
  };

  const canNicknameCheck = (() => {
    if (!isNicknameValid) return false;
    if (nicknameCheckStatus === 'checking') return false;
    return true;
  })();

  return {
    nicknameCheckStatus,
    canNicknameCheck,
    nicknameFeedback,
    bioFeedback,
    displayProfileImageUrl,
    profileImageErrorMessage,
    isProfileImageUploading,
    resetNicknameCheck,
    handleCheckNickname,
    handleSelectDefaultImage,
    handleProfileImageFileChange,
  };
}

export default useProfileStep;
