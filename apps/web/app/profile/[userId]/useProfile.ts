'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { type PublicUserProfile } from '@/lib';
import { useAuthStore } from '@/store/authStore';
import UsersService from '@/services/users';

type ProfileStatus = 'loading' | 'success' | 'error' | 'not-found';

export function useProfile(userId: string) {
  const token = useAuthStore((state) => state.token);
  const me = useAuthStore((state) => state.user);
  const isAuthStoreHydrated = useAuthStore((state) => state.hasHydrated);
  const setMe = useAuthStore((state) => state.setUser);

  const isOwner = me?.id === userId;

  // 내 프로필은 auth store의 user를 그대로 쓰고, 남의 프로필만 로컬 state로 들고 있음
  const [otherUser, setOtherUser] = useState<PublicUserProfile | null>(null);
  const [otherUserStatus, setOtherUserStatus] = useState<ProfileStatus>('loading');

  useEffect(() => {
    if (!isAuthStoreHydrated || isOwner) return;

    setOtherUserStatus('loading');
    UsersService.getUserProfile(userId, token).then((result) => {
      if (result.isSuccess) {
        setOtherUser(result.data);
        setOtherUserStatus('success');
      } else if (result.statusCode === 404) {
        setOtherUserStatus('not-found');
      } else {
        setOtherUserStatus('error');
      }
    });
  }, [userId, isOwner, token, isAuthStoreHydrated]);

  // 저장된 user를 먼저 보여주고, 진입할 때마다 getMe로 최신 값(팔로워/팔로잉 수 등)으로 갱신
  useEffect(() => {
    if (!isAuthStoreHydrated || !isOwner) return;

    UsersService.getMe(token).then((result) => {
      if (result.isSuccess) setMe(result.data);
    });
  }, [isOwner, token, isAuthStoreHydrated, setMe]);

  // 로딩 화면 없이 프로필(카운트 등)만 조용히 다시 가져옴
  const refresh = useCallback(async () => {
    if (isOwner) {
      const result = await UsersService.getMe(token);
      if (result.isSuccess) setMe(result.data);
      return;
    }
    const result = await UsersService.getUserProfile(userId, token);
    if (result.isSuccess) {
      setOtherUser(result.data);
    } else if (result.statusCode === 404) {
      setOtherUserStatus('not-found');
    }
  }, [isOwner, userId, token, setMe]);

  const markNotFound = useCallback(() => setOtherUserStatus('not-found'), []);

  const user = useMemo<PublicUserProfile | null>(
    () => (isOwner && me ? { ...me, isFollowing: false } : otherUser),
    [isOwner, me, otherUser],
  );
  const status: ProfileStatus = isOwner ? 'success' : otherUserStatus;
  const email = isOwner ? (me?.email ?? null) : null;

  return { user, email, status, isOwner, refresh, markNotFound };
}
