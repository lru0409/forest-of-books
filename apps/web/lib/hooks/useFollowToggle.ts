'use client';

import { useState } from 'react';

import { useAuthStore } from '@/store/authStore';
import FollowService from '@/services/follow';

interface FollowToggleError {
  statusCode: number;
  action: 'follow' | 'unfollow';
}

interface UseFollowToggleOptions {
  userId: string;
  initialIsFollowing: boolean;
  onChange?: (isFollowing: boolean) => void;
  onError?: (error: FollowToggleError) => void;
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
  onError,
}: UseFollowToggleOptions): UseFollowToggleResult {
  const token = useAuthStore((state) => state.token);

  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isPending, setIsPending] = useState(false);

  const toggleFollow = async () => {
    if (!token) return;

    const action = isFollowing ? 'unfollow' : 'follow';

    setIsPending(true);
    const request =
      action === 'unfollow'
        ? FollowService.unfollowUser(userId, token)
        : FollowService.followUser(userId, token);

    try {
      const result = await request;
      if (result.isSuccess) {
        const next = !isFollowing;
        setIsFollowing(next);
        onChange?.(next);
      } else if (result.statusCode !== 401) {
        onError?.({ statusCode: result.statusCode, action });
      }
    } finally {
      setIsPending(false);
    }
  };

  return { isFollowing, isPending, toggleFollow };
}
