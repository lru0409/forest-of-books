'use client';

import { useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';

import { PROFILE_IMAGE_ACCEPTED_TYPES } from '../constants';
import { Button, Input, Textarea } from '@/components/ui';
import { useSignupStore } from '@/store/signupStore';
import { Step } from '../constants';
import { ProfileImageOverlay } from './ProfileImageOverlay';
import useProfileStep from '../_hooks/useProfileStep';

export const ProfileStep = () => {
  const router = useRouter();
  const { update, nickname: defaultNickname, bio: defaultBio } = useSignupStore();

  const [nickname, setNickname] = useState(defaultNickname);
  const [bio, setBio] = useState(defaultBio);
  const [touched, setTouched] = useState({ nickname: false, bio: false });

  const {
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
  } = useProfileStep(nickname, bio);

  const [isProfileImageOverlayOpen, setIsProfileImageOverlayOpen] = useState(false);
  const profileImageInputRef = useRef<HTMLInputElement>(null);

  const selectedDefaultProfileImageIndex = useMemo(() => {
    const match = displayProfileImageUrl.match(/profile-defaults\/(\d+)\.png$/);
    if (!match?.[1]) {
      return null;
    }
    return parseInt(match[1], 10) - 1;
  }, [displayProfileImageUrl]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    update({ nickname, bio, nicknameVerified: true });
    router.push(`/signup?step=${Step.GENRES}`);
  };

  return (
    <form className="flex flex-1 flex-col justify-between" onSubmit={onSubmit}>
      <div>
        <h1 className="mb-2 text-3xl font-bold">프로필 설정하기</h1>
        <p className="text-secondary mb-8 text-base">
          다른 유저에게 보여질 프로필을 완성해 주세요.
        </p>

        <label htmlFor="nickname" className="mb-1 block text-lg font-semibold">
          닉네임
        </label>
        <p className="text-secondary mb-2 text-sm">* 2~12자의 한글, 영문, 숫자</p>
        <Input
          id="nickname"
          type="text"
          placeholder="닉네임을 입력하세요."
          value={nickname}
          onChange={(e) => {
            setNickname(e.target.value);
            resetNicknameCheck();
          }}
          onBlur={() => setTouched((prev) => ({ ...prev, nickname: true }))}
          readOnly={nicknameCheckStatus === 'checking'}
          state={touched.nickname ? nicknameFeedback.state : 'default'}
          message={touched.nickname ? nicknameFeedback.message : undefined}
          suffix={
            <Button
              type="button"
              size="xs"
              onClick={() => handleCheckNickname(nickname)}
              disabled={!canNicknameCheck}
              isLoading={nicknameCheckStatus === 'checking'}
              className="-mr-1.5 w-16.5"
            >
              중복 확인
            </Button>
          }
          className="mb-5"
        />

        <label htmlFor="bio" className="mb-1 block text-lg font-semibold">
          자기소개
        </label>
        <p className="text-secondary mb-2.5 text-sm">가입 후 언제든지 수정할 수 있어요.</p>
        <Textarea
          id="bio"
          placeholder="소설책이나 철학책을 즐겨읽어요!"
          value={bio}
          warnLength={160}
          showCounter
          onChange={(e) => setBio(e.target.value)}
          onBlur={() => setTouched((prev) => ({ ...prev, bio: true }))}
          state={touched.bio ? bioFeedback.state : 'default'}
          message={touched.bio ? bioFeedback.message : undefined}
          className="mb-5"
        />

        <label htmlFor="profileImage" className="mb-1 block text-lg font-semibold">
          프로필 이미지
        </label>
        <p className="text-secondary mb-4 text-sm">
          기본 프로필 이미지 중 선택하거나 직접 업로드할 수 있어요.
        </p>

        <div className="mb-14 flex flex-col items-center">
          <div className="bg-primary/70 border-primary mb-4 size-35 overflow-hidden rounded-full border-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={displayProfileImageUrl}
              alt="프로필 이미지"
              className="h-full w-full object-cover"
            />
          </div>
          <Button
            type="button"
            size="sm"
            className="mb-2 h-10.5 w-50"
            disabled={isProfileImageUploading}
            onClick={() => setIsProfileImageOverlayOpen(true)}
          >
            기본 프로필 이미지 선택
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-10.5 w-50"
            disabled={isProfileImageUploading}
            isLoading={isProfileImageUploading}
            onClick={() => profileImageInputRef.current?.click()}
          >
            직접 업로드
          </Button>
          {profileImageErrorMessage && (
            <p className="text-destructive mt-2 text-sm">{profileImageErrorMessage}</p>
          )}
          <input
            ref={profileImageInputRef}
            type="file"
            accept={PROFILE_IMAGE_ACCEPTED_TYPES.join(',')}
            className="hidden"
            onChange={handleProfileImageFileChange}
            aria-label="프로필 이미지 업로드"
          />
        </div>
      </div>

      {isProfileImageOverlayOpen && (
        <ProfileImageOverlay
          onClose={() => setIsProfileImageOverlayOpen(false)}
          onSelect={handleSelectDefaultImage}
          selectedIndex={selectedDefaultProfileImageIndex}
        />
      )}

      <div className="flex gap-2">
        <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}>
          이전
        </Button>
        <Button
          type="submit"
          className="flex-1"
          disabled={nicknameCheckStatus !== 'available' || isProfileImageUploading}
        >
          다음
        </Button>
      </div>
    </form>
  );
};
