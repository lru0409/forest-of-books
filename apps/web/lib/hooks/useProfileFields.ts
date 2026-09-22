import { useMemo, useState } from 'react';

import { isValidNickname, PROFILE_IMAGE_ACCEPTED_TYPES, PROFILE_IMAGE_MAX_FILE_SIZE } from '@/lib';
import authService from '@/services/auth';
import type { InputState } from '@/components/ui/input';
import type { TextareaState } from '@/components/ui/textarea';

type NicknameCheckStatus = 'idle' | 'checking' | 'available' | 'unavailable' | 'error';

interface UseProfileFieldsParams {
  initialNickname: string;
  initialBio: string;
  initialProfileImageUrl: string;
  initialNicknameVerified?: boolean;
  onProfileImageChange?: (url: string) => void;
}

function useProfileFields({
  initialNickname,
  initialBio,
  initialProfileImageUrl,
  initialNicknameVerified = false,
  onProfileImageChange,
}: UseProfileFieldsParams) {
  const [nickname, setNicknameState] = useState(initialNickname);
  const [bio, setBio] = useState(initialBio);
  const [profileImageUrl, setProfileImageUrl] = useState(initialProfileImageUrl);
  const [nicknameCheckStatus, setNicknameCheckStatus] = useState<NicknameCheckStatus>(
    initialNicknameVerified ? 'available' : 'idle',
  );
  const [profileImageErrorMessage, setProfileImageErrorMessage] = useState<string | null>(null);
  const [isProfileImageUploading, setIsProfileImageUploading] = useState(false);

  const isNicknameValid = isValidNickname(nickname);
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

  const setNickname = (value: string) => {
    setNicknameState(value);
    setNicknameCheckStatus('idle');
  };

  const checkNickname = async () => {
    setNicknameCheckStatus('checking');
    try {
      const result = await authService.checkNickname(nickname);
      setNicknameCheckStatus(
        result.isSuccess ? (result.data.available ? 'available' : 'unavailable') : 'error',
      );
    } catch {
      setNicknameCheckStatus('error');
    }
  };

  const selectedDefaultProfileImageIndex = useMemo(() => {
    const match = profileImageUrl.match(/profile-defaults\/(\d+)\.png$/);
    if (!match?.[1]) return null;
    return parseInt(match[1], 10) - 1;
  }, [profileImageUrl]);

  const selectDefaultProfileImage = (index: number) => {
    if (profileImageUrl.startsWith('blob:')) URL.revokeObjectURL(profileImageUrl);
    const url = `${process.env.NEXT_PUBLIC_BASE_URL}/images/profile-defaults/${index + 1}.png`;
    setProfileImageUrl(url);
    onProfileImageChange?.(url);
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

    const prevProfileImageUrl = profileImageUrl;
    const previewProfileImageUrl = URL.createObjectURL(file);
    setProfileImageUrl(previewProfileImageUrl);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const result = await authService.uploadProfileImage(formData);
      if (result.isSuccess) {
        if (prevProfileImageUrl.startsWith('blob:')) URL.revokeObjectURL(prevProfileImageUrl);
        setProfileImageUrl(result.data.url);
        onProfileImageChange?.(result.data.url);
        return;
      }
      throw new Error('upload failed');
    } catch {
      setProfileImageErrorMessage('프로필 이미지 업로드에 실패했어요. 나중에 다시 시도해주세요.');
      URL.revokeObjectURL(previewProfileImageUrl);
      setProfileImageUrl(prevProfileImageUrl);
    } finally {
      setIsProfileImageUploading(false);
      e.target.value = '';
    }
  };

  return {
    nickname: {
      value: nickname,
      setValue: setNickname,
      checkStatus: nicknameCheckStatus,
      canCheck: isNicknameValid && nicknameCheckStatus !== 'checking',
      check: checkNickname,
      feedback: nicknameFeedback,
      markUnavailable: () => setNicknameCheckStatus('unavailable'),
    },
    bio: {
      value: bio,
      setValue: setBio,
      feedback: bioFeedback,
    },
    profileImage: {
      url: profileImageUrl,
      errorMessage: profileImageErrorMessage,
      isUploading: isProfileImageUploading,
      selectedDefaultIndex: selectedDefaultProfileImageIndex,
      selectDefault: selectDefaultProfileImage,
      handleFileChange: handleProfileImageFileChange,
    },
  };
}

export default useProfileFields;
