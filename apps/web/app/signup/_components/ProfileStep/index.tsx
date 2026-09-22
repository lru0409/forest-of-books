'use client';

import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui';
import { ProfileFieldsSection } from '@/components/common';
import useProfileFields from '@/lib/hooks/useProfileFields';
import { useSignupStore } from '@/store/signupStore';
import { Step } from '../../constants';

export const ProfileStep = () => {
  const router = useRouter();
  const {
    update,
    nickname: defaultNickname,
    bio: defaultBio,
    nicknameVerified: defaultNicknameVerified,
    profileImageUrl: defaultProfileImageUrl,
  } = useSignupStore();

  const fields = useProfileFields({
    initialNickname: defaultNickname,
    initialBio: defaultBio,
    initialProfileImageUrl: defaultProfileImageUrl,
    initialNicknameVerified: defaultNicknameVerified,
    onProfileImageChange: (url) => update({ profileImageUrl: url }),
  });
  const { nickname, bio, profileImage } = fields;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    update({ nickname: nickname.value, bio: bio.value, nicknameVerified: true });
    router.push(`/signup?step=${Step.GENRES}`);
  };

  return (
    <form className="flex flex-1 flex-col justify-between" onSubmit={onSubmit}>
      <div>
        <h1 className="mb-2 text-3xl font-bold">프로필 설정하기</h1>
        <p className="text-secondary mb-8 text-base">
          다른 유저에게 보여질 프로필을 완성해 주세요.
        </p>
        <ProfileFieldsSection fields={fields} />
      </div>

      <div className="flex gap-2 pb-10">
        <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}>
          이전
        </Button>
        <Button
          type="submit"
          className="flex-1"
          disabled={
            nickname.checkStatus !== 'available' ||
            profileImage.isUploading ||
            bio.feedback.state === 'error'
          }
        >
          다음
        </Button>
      </div>
    </form>
  );
};
