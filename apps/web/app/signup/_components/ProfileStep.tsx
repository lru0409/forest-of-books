'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useForm, Controller, type ControllerFieldState } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button, Input, Textarea } from '@/components/ui';
import { profileSchema, type ProfileFormData } from '../schemas';
import { useSignupStore } from '@/store/signupStore';
import { Step } from '../constants';
import { ProfileImageOverlay } from './ProfileImageOverlay';
import authService from '@/services/auth';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

type NicknameCheckStatus = 'idle' | 'checking' | 'available' | 'unavailable' | 'error';

export const ProfileStep = () => {
  const router = useRouter();
  const {
    update,
    nickname: defaultNickname,
    nicknameVerified: defaultNicknameVerified,
    bio: defaultBio,
    profileImage: defaultProfileImage,
  } = useSignupStore();
  const defaultProfileImageFile =
    defaultProfileImage.kind === 'uploaded' ? defaultProfileImage.file : null;

  const [selectedProfileImageIndex, setSelectedProfileImageIndex] = useState<number | null>(
    defaultProfileImage.kind === 'default' ? defaultProfileImage.index : null,
  );
  const [isProfileImageOverlayOpen, setIsProfileImageOverlayOpen] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreviewUrl, setProfileImagePreviewUrl] = useState<string | null>(null);
  const [profileImageError, setProfileImageError] = useState<string | null>(null);
  const profileImageInputRef = useRef<HTMLInputElement>(null);
  const [nicknameCheckStatus, setNicknameCheckStatus] = useState<NicknameCheckStatus>(
    defaultNicknameVerified ? 'available' : 'idle',
  );
  const isNicknameChecking = nicknameCheckStatus === 'checking';

  useEffect(() => {
    if (!defaultProfileImageFile) return;

    const url = URL.createObjectURL(defaultProfileImageFile);
    setProfileImageFile(defaultProfileImageFile);
    setProfileImagePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [defaultProfileImageFile]);

  const handleProfileImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setProfileImageError('JPG, PNG, WEBP, GIF 형식만 업로드할 수 있어요.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setProfileImageError('5MB 이하의 파일만 업로드할 수 있어요.');
      return;
    }

    setProfileImageError(null);
    if (profileImagePreviewUrl) URL.revokeObjectURL(profileImagePreviewUrl);

    const previewUrl = URL.createObjectURL(file);
    setProfileImageFile(file);
    setProfileImagePreviewUrl(previewUrl);
    setSelectedProfileImageIndex(null);

    e.target.value = '';
  };

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    mode: 'onChange',
    defaultValues: {
      nickname: defaultNickname,
      bio: defaultBio,
    },
  });

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
      update({ nicknameVerified: nextStatus === 'available' });
    }
  };

  const getNicknameFeedback = (
    fieldState: ControllerFieldState,
    nicknameCheckStatus: NicknameCheckStatus,
  ): { state: 'error' | 'success' | 'default'; message?: string } => {
    if (fieldState.isTouched && fieldState.error) {
      return { state: 'error', message: fieldState.error.message };
    }
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
  };

  const onSubmit = (data: ProfileFormData) => {
    if (nicknameCheckStatus !== 'available') return;
    const profileImage =
      profileImageFile !== null
        ? { kind: 'uploaded' as const, file: profileImageFile }
        : { kind: 'default' as const, index: selectedProfileImageIndex ?? 0 };
    update({ ...data, profileImage });
    router.push(`/signup?step=${Step.GENRES}`);
  };

  const handleSelectDefaultImage = (index: number) => {
    if (profileImagePreviewUrl) {
      URL.revokeObjectURL(profileImagePreviewUrl);
      setProfileImagePreviewUrl(null);
    }
    setProfileImageFile(null);
    setSelectedProfileImageIndex(index);
    setIsProfileImageOverlayOpen(false);
  };

  return (
    <form className="flex flex-1 flex-col justify-between" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <h1 className="mb-2 text-3xl font-bold">프로필 설정하기</h1>
        <p className="text-secondary mb-8 text-base">
          다른 유저에게 보여질 프로필을 완성해 주세요.
        </p>

        <label htmlFor="nickname" className="mb-1 block text-lg font-semibold">
          닉네임
        </label>
        <p className="text-secondary mb-2 text-sm">* 2~12자의 한글, 영문, 숫자</p>
        <Controller
          name="nickname"
          control={control}
          render={({ field, fieldState }) => {
            const nicknameInputFeedback = getNicknameFeedback(fieldState, nicknameCheckStatus);

            return (
              <Input
                id="nickname"
                type="text"
                placeholder="닉네임을 입력하세요."
                value={field.value}
                onChange={(e) => {
                  field.onChange(e);
                  setNicknameCheckStatus('idle');
                  update({ nicknameVerified: false });
                }}
                onBlur={field.onBlur}
                readOnly={isNicknameChecking}
                clearable={!isNicknameChecking}
                state={nicknameInputFeedback.state}
                message={nicknameInputFeedback.message}
                suffix={
                  <Button
                    type="button"
                    size="xs"
                    onClick={() => handleCheckNickname(field.value)}
                    disabled={!!fieldState.error || !field.value || isNicknameChecking}
                    isLoading={isNicknameChecking}
                    className="-mr-1.5 w-16.5"
                  >
                    중복 확인
                  </Button>
                }
                className="mb-5"
              />
            );
          }}
        />

        <label htmlFor="bio" className="mb-1 block text-lg font-semibold">
          자기소개
        </label>
        <p className="text-secondary mb-2.5 text-sm">가입 후 언제든지 수정할 수 있어요.</p>
        <Controller
          name="bio"
          control={control}
          render={({ field, fieldState }) => (
            <Textarea
              id="bio"
              placeholder="소설책이나 철학책을 즐겨읽어요!"
              value={field.value}
              warnLength={160}
              showCounter
              onChange={field.onChange}
              onBlur={field.onBlur}
              state={fieldState.error ? 'error' : 'default'}
              message={fieldState.error?.message}
              className="mb-5"
            />
          )}
        />

        <label htmlFor="profileImage" className="mb-1 block text-lg font-semibold">
          프로필 이미지
        </label>
        <p className="text-secondary mb-4 text-sm">
          기본 프로필 이미지 중 선택하거나 직접 업로드할 수 있어요.
        </p>

        <div className="mb-14 flex flex-col items-center">
          <div className="bg-primary/70 border-primary mb-4 size-35 overflow-hidden rounded-full border-2">
            {profileImagePreviewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profileImagePreviewUrl}
                alt="업로드한 프로필 이미지"
                className="h-full w-full object-cover"
              />
            ) : (
              <Image
                src={`/images/profile-defaults/${(selectedProfileImageIndex ?? 0) + 1}.png`}
                alt="기본 프로필 이미지"
                width={140}
                height={140}
              />
            )}
          </div>
          <Button
            size="sm"
            className="mb-2 w-50"
            onClick={() => setIsProfileImageOverlayOpen(true)}
          >
            기본 프로필 이미지 선택
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="w-50"
            onClick={() => profileImageInputRef.current?.click()}
          >
            직접 업로드
          </Button>
          {profileImageError && (
            <p className="text-destructive mt-2 text-sm">{profileImageError}</p>
          )}
          <input
            ref={profileImageInputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(',')}
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
          selectedIndex={selectedProfileImageIndex}
        />
      )}

      <div className="flex gap-2">
        <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}>
          이전
        </Button>
        <Button
          type="submit"
          className="flex-1"
          disabled={Boolean(errors.nickname) || nicknameCheckStatus !== 'available'}
        >
          다음
        </Button>
      </div>
    </form>
  );
};
