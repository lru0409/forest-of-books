'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button, Input, Textarea } from '@/components/ui';
import { profileSchema, type ProfileFormData } from '../schemas';
import { useSignupStore } from '@/store/signupStore';
import { Step } from '../constants';
import { ProfileImageOverlay } from './ProfileImageOverlay';

export const ProfileStep = () => {
  const router = useRouter();
  const setStepData = useSignupStore((s) => s.setProfileStep);
  const defaultNickname = useSignupStore((s) => s.nickname);
  const defaultBio = useSignupStore((s) => s.bio);

  const [isProfileImageOverlayOpen, setIsProfileImageOverlayOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    mode: 'onTouched',
    defaultValues: {
      nickname: defaultNickname,
      bio: defaultBio,
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    setStepData({ ...data, profileImageIndex: selectedImageIndex });
    router.push(`/signup?step=${Step.GENRES}`);
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
          render={({ field, fieldState }) => (
            <Input
              id="nickname"
              type="text"
              placeholder="닉네임을 입력하세요."
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              state={fieldState.isTouched && fieldState.error ? 'error' : 'default'}
              message={fieldState.isTouched ? fieldState.error?.message : undefined}
              className="mb-5"
            />
          )}
        />

        <label htmlFor="bio" className="mb-1 block text-lg font-semibold">
          자기소개
        </label>
        <p className="text-secondary mb-2.5 text-sm">가입 후 언제든지 수정할 수 있어요.</p>
        <Controller
          name="bio"
          control={control}
          render={({ field }) => (
            <Textarea
              id="bio"
              placeholder="소설책이나 철학책을 즐겨읽어요!"
              value={field.value}
              maxLength={160}
              onChange={field.onChange}
              onBlur={field.onBlur}
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
            <Image
              src={`/images/profile-defaults/${selectedImageIndex + 1}.png`}
              alt="기본 프로필 이미지"
              width={140}
              height={140}
            />
          </div>
          <Button
            size="sm"
            className="mb-2 w-50"
            onClick={() => setIsProfileImageOverlayOpen(true)}
          >
            기본 프로필 이미지 선택
          </Button>
          <Button size="sm" variant="outline" className="w-50">
            직접 업로드
          </Button>
        </div>
      </div>

      {isProfileImageOverlayOpen && (
        <ProfileImageOverlay
          onClose={() => setIsProfileImageOverlayOpen(false)}
          onSelect={(index: number) => {
            setSelectedImageIndex(index);
            setIsProfileImageOverlayOpen(false);
          }}
          selectedIndex={selectedImageIndex}
        />
      )}

      <div className="flex gap-2">
        <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}>
          이전
        </Button>
        <Button
          type="submit"
          className="flex-1"
          disabled={Boolean(errors.nickname)}
          onClick={() => router.push(`/signup?step=${Step.GENRES}`)}
        >
          다음
        </Button>
      </div>
    </form>
  );
};
