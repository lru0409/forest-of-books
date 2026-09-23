'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

import { Button } from '@/components/ui';
import { GenreSelector, ProfileFieldsSection } from '@/components/common';
import { Container } from '@/components/layout';
import { type Me } from '@/lib';
import { useAuthStore } from '@/store/authStore';
import useEditProfileForm from './useEditProfileForm';

interface EditProfilePageProps {
  params: Promise<{ userId: string }>;
}

export default function EditProfilePage({ params }: EditProfilePageProps) {
  const { userId } = use(params);
  const router = useRouter();

  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const currentUser = useAuthStore((state) => state.user);
  const isOwner = currentUser?.id === userId;

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isOwner) router.replace(`/profile/${userId}`);
  }, [hasHydrated, isOwner, userId, router]);

  if (!currentUser || !isOwner) return null;

  return <EditProfileForm userId={userId} user={currentUser} />;
}

function EditProfileForm({ userId, user }: { userId: string; user: Me }) {
  const router = useRouter();

  const {
    profileFields,
    preferredGenres,
    toggleGenre,
    submitErrorMessage,
    isSubmitting,
    handleSubmit,
  } = useEditProfileForm(user, () => router.push(`/profile/${userId}`));

  return (
    <Container className="flex items-start justify-center" showBottomNav={false}>
      <div className="relative mt-16 flex min-h-[calc(100%-4rem)] w-125 flex-col">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-secondary hover:text-primary absolute -top-9.5 left-0 flex cursor-pointer items-center gap-0.5 text-sm font-medium transition-colors"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          돌아가기
        </button>

        <h1 className="mb-2 text-3xl font-bold">프로필 수정</h1>
        <p className="text-secondary mb-8 text-base">다른 유저에게 보여질 프로필을 수정해요.</p>

        <ProfileFieldsSection fields={profileFields} />

        <label htmlFor="preferredGenres" className="mb-1 block text-lg font-semibold">
          선호 장르
        </label>
        <p className="text-secondary mb-4 text-sm">좋아하는 장르를 선택해 주세요.</p>

        <div className="mb-10">
          <GenreSelector selected={preferredGenres} onToggle={toggleGenre} />
        </div>

        {submitErrorMessage && (
          <p className="text-destructive mb-4 text-sm">{submitErrorMessage}</p>
        )}

        <Button
          className="w-full"
          disabled={
            isSubmitting ||
            profileFields.profileImage.isUploading ||
            profileFields.nickname.checkStatus !== 'available' ||
            profileFields.bio.feedback.state === 'error'
          }
          isLoading={isSubmitting}
          onClick={handleSubmit}
        >
          저장
        </Button>
      </div>
    </Container>
  );
}
