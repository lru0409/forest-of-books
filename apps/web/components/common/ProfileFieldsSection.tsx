'use client';

import { useRef, useState } from 'react';

import { Button, Input, Textarea } from '@/components/ui';
import { PROFILE_IMAGE_ACCEPTED_TYPES } from '@/lib';
import type useProfileFields from '@/lib/hooks/useProfileFields';
import { ProfileImageOverlay } from './ProfileImageOverlay';

interface ProfileFieldsSectionProps {
  fields: ReturnType<typeof useProfileFields>;
}

export const ProfileFieldsSection = ({ fields }: ProfileFieldsSectionProps) => {
  const { nickname, bio, profileImage } = fields;

  const [touched, setTouched] = useState({ nickname: false, bio: false });
  const [isProfileImageOverlayOpen, setIsProfileImageOverlayOpen] = useState(false);
  const profileImagefileInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <label htmlFor="nickname" className="mb-1 block text-lg font-semibold">
        닉네임
      </label>
      <p className="text-secondary mb-2 text-sm">* 2~12자의 한글, 영문, 숫자</p>
      <Input
        id="nickname"
        type="text"
        placeholder="닉네임을 입력하세요."
        value={nickname.value}
        onChange={(e) => nickname.setValue(e.target.value)}
        onBlur={() => setTouched((prev) => ({ ...prev, nickname: true }))}
        readOnly={nickname.checkStatus === 'checking'}
        state={touched.nickname ? nickname.feedback.state : 'default'}
        message={touched.nickname ? nickname.feedback.message : undefined}
        suffix={
          <Button
            type="button"
            size="xs"
            onClick={() => nickname.check()}
            disabled={!nickname.canCheck}
            isLoading={nickname.checkStatus === 'checking'}
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
      <p className="text-secondary mb-2.5 text-sm">언제든지 다시 수정할 수 있어요.</p>
      <Textarea
        id="bio"
        placeholder="소설책이나 철학책을 즐겨읽어요!"
        value={bio.value}
        warnLength={160}
        showCounter
        onChange={(e) => bio.setValue(e.target.value)}
        onBlur={() => setTouched((prev) => ({ ...prev, bio: true }))}
        state={touched.bio ? bio.feedback.state : 'default'}
        message={touched.bio ? bio.feedback.message : undefined}
        className="mb-5"
      />

      <label htmlFor="profileImage" className="mb-1 block text-lg font-semibold">
        프로필 이미지
      </label>
      <p className="text-secondary mb-4 text-sm">
        기본 프로필 이미지 중 선택하거나 직접 업로드할 수 있어요.
      </p>

      <div className="mb-14 flex flex-col items-center">
        <div className="mb-4 size-35 overflow-hidden rounded-full shadow-[0_0_10px_5px_color-mix(in_srgb,var(--color-primary-foreground)_50%,transparent)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={profileImage.url} alt="프로필 이미지" className="h-full w-full object-cover" />
        </div>
        <Button
          type="button"
          size="sm"
          className="mb-2 h-10.5 w-50"
          disabled={profileImage.isUploading}
          onClick={() => setIsProfileImageOverlayOpen(true)}
        >
          기본 프로필 이미지 선택
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-10.5 w-50"
          disabled={profileImage.isUploading}
          isLoading={profileImage.isUploading}
          onClick={() => profileImagefileInputRef.current?.click()}
        >
          직접 업로드
        </Button>
        {profileImage.errorMessage && (
          <p className="text-destructive mt-2 text-sm">{profileImage.errorMessage}</p>
        )}
        <input
          ref={profileImagefileInputRef}
          type="file"
          accept={PROFILE_IMAGE_ACCEPTED_TYPES.join(',')}
          className="hidden"
          onChange={profileImage.handleFileChange}
          aria-label="프로필 이미지 업로드"
        />
      </div>

      {isProfileImageOverlayOpen && (
        <ProfileImageOverlay
          onClose={() => setIsProfileImageOverlayOpen(false)}
          onSelect={profileImage.selectDefault}
          selectedIndex={profileImage.selectedDefaultIndex}
        />
      )}
    </>
  );
};
