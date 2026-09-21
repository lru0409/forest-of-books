'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TriangleAlert, LoaderCircle, UserRoundX } from 'lucide-react';

import { type LibraryEntryListItem, type PublicUserProfile } from '@/lib';
import { Container } from '@/components/layout';
import { StatusNotice } from '@/components/common';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import LibraryService from '@/services/library';
import UsersService from '@/services/users';
import { ProfileCard } from './_components/ProfileCard';
import { BookList } from './_components/BookList';

interface ProfilePageProps {
  params: Promise<{ userId: string }>;
}

export default function ProfilePage({ params }: ProfilePageProps) {
  const { userId } = use(params);
  const router = useRouter();

  const token = useAuthStore((state) => state.token);
  const currentUser = useAuthStore((state) => state.user);
  const isOwner = currentUser?.id === userId;

  const [user, setUser] = useState<PublicUserProfile | null>(null);
  const [profileStatus, setProfileStatus] = useState<'loading' | 'success' | 'error' | 'not-found'>(
    'loading',
  );

  const [items, setItems] = useState<LibraryEntryListItem[]>([]);
  const [itemsStatus, setItemsStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (isOwner) {
      setUser(currentUser);
      setProfileStatus('success');
      return;
    }

    setProfileStatus('loading');
    UsersService.getUserProfile(userId).then((result) => {
      if (result.isSuccess) {
        setUser(result.data);
        setProfileStatus('success');
      } else if (result.statusCode === 404) {
        setProfileStatus('not-found');
      } else {
        setProfileStatus('error');
      }
    });
  }, [userId, isOwner, currentUser]);

  useEffect(() => {
    setItemsStatus('loading');
    const request = isOwner
      ? LibraryService.getMyLibrary(token as string)
      : LibraryService.getUserLibrary(userId, token);
    request.then((result) => {
      if (result.isSuccess) {
        setItems(result.data);
        setItemsStatus('success');
      } else if (isOwner && result.statusCode === 401) {
        router.replace('/profile');
      } else {
        setItemsStatus('error');
      }
    });
  }, [userId, token, isOwner, router]);

  if (profileStatus === 'not-found') {
    return (
      <Container>
        <StatusNotice
          className="h-full"
          icon={
            <UserRoundX className="text-primary size-14" strokeWidth={1.6} aria-hidden="true" />
          }
          title="유저를 찾을 수 없어요"
          description="삭제되었거나 존재하지 않는 계정이에요."
        />
      </Container>
    );
  }

  if (profileStatus === 'error' || itemsStatus === 'error') {
    return (
      <Container>
        <StatusNotice
          className="h-full"
          icon={
            <TriangleAlert className="text-primary size-14" strokeWidth={1.6} aria-hidden="true" />
          }
          title="프로필을 불러오지 못했어요"
          description="잠시 후 다시 시도해주세요."
        />
      </Container>
    );
  }

  if (!user || profileStatus === 'loading' || itemsStatus === 'loading') {
    return (
      <Container>
        <StatusNotice
          className="h-full"
          icon={
            <LoaderCircle
              className="text-primary size-12 animate-spin"
              strokeWidth={2}
              aria-hidden="true"
            />
          }
          title="프로필을 불러오는 중이에요"
        />
      </Container>
    );
  }

  const isEmpty = items.length === 0;

  return (
    <Container>
      <div
        className={cn(
          'flex min-h-200 flex-col gap-5 xl:flex-row xl:items-start xl:gap-8',
          isEmpty && 'xl:h-full',
        )}
      >
        <div className="w-full xl:sticky xl:top-0 xl:w-74 xl:min-w-74">
          <ProfileCard user={user} isOwner={isOwner} bookCount={items.length} />
        </div>
        <div className={cn('flex flex-1 flex-col', isEmpty && 'xl:h-full')}>
          <BookList items={items} isOwner={isOwner} />
        </div>
      </div>
    </Container>
  );
}
