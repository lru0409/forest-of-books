'use client';

import { useState } from 'react';

import { useAuthStore } from '@/store/authStore';
import FollowService from '@/services/follow';

interface UseFollowToggleOptions {
  userId: string;
  initialIsFollowing: boolean;
  onChange?: (isFollowing: boolean) => void;
}

interface UseFollowToggleResult {
  isFollowing: boolean;
  isPending: boolean;
  toggleFollow: () => Promise<void>;
}

export function useFollowToggle({
  userId,
  initialIsFollowing,
  onChange,
}: UseFollowToggleOptions): UseFollowToggleResult {
  const token = useAuthStore((state) => state.token);

  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isPending, setIsPending] = useState(false);

  const toggleFollow = async () => {
    if (!token) return;

    setIsPending(true);
    const request = isFollowing
      ? FollowService.unfollowUser(userId, token)
      : FollowService.followUser(userId, token);

    try {
      const result = await request;
      if (result.isSuccess) {
        const next = !isFollowing;
        setIsFollowing(next);
        onChange?.(next);
      }
    } finally {
      setIsPending(false);
    }
  };

  return { isFollowing, isPending, toggleFollow };
}
