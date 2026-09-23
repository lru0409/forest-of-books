import { useState } from 'react';

import { type Genre, type PublicUserProfile } from '@/lib';
import useProfileFields from '@/lib/hooks/useProfileFields';
import usersService from '@/services/users';
import { useAuthStore } from '@/store/authStore';

type EditableUser = Pick<
  PublicUserProfile,
  'nickname' | 'bio' | 'profileImage' | 'preferredGenres'
>;

function useEditProfileForm(user: EditableUser, onSuccess: () => void) {
  const token = useAuthStore((state) => state.token);
  const setUser = useAuthStore((state) => state.setUser);

  const profileFields = useProfileFields({
    initialNickname: user.nickname,
    initialBio: user.bio,
    initialProfileImageUrl: user.profileImage,
  });

  const [preferredGenres, setPreferredGenres] = useState<Genre[]>(user.preferredGenres);
  const [submitErrorMessage, setSubmitErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleGenre = (genre: Genre) => {
    setPreferredGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre],
    );
  };

  const handleSubmit = async () => {
    if (!token) return;

    setSubmitErrorMessage(null);
    setIsSubmitting(true);

    const result = await usersService.updateMyProfile(
      {
        nickname: profileFields.nickname.value,
        bio: profileFields.bio.value,
        profileImage: profileFields.profileImage.url,
        preferredGenres,
      },
      token,
    );

    setIsSubmitting(false);

    if (result.isSuccess) {
      setUser(result.data);
      onSuccess();
      return;
    }

    if (result.statusCode === 409 && result.errorCode === 'NICKNAME_ALREADY_EXISTS') {
      profileFields.nickname.markUnavailable();
      return;
    }

    setSubmitErrorMessage('저장에 실패했어요. 잠시 후 다시 시도해주세요.');
  };

  return {
    profileFields,
    preferredGenres,
    toggleGenre,
    submitErrorMessage,
    isSubmitting,
    handleSubmit,
  };
}

export default useEditProfileForm;
