'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { GenreBadge } from '@/components/common';
import { MOCK_BADGES, type Badge, type PublicUserProfile, useFollowToggle } from '@/lib';
import { useAuthStore } from '@/store/authStore';
import { useDialog } from '@/context/dialog';
import { Avatar } from './Avatar';
import { BadgeCollectionModal } from './BadgeCollectionModal';
import { FollowListModal } from './FollowListModal';

interface ProfileCardProps {
  user: PublicUserProfile;
  isOwner: boolean;
  bookCount: number;
}

export function ProfileCard({ user, isOwner, bookCount }: ProfileCardProps) {
  const { openDialog, closeDialog } = useDialog();
  const isLoggedIn = useAuthStore((state) => state.token !== null);

  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(MOCK_BADGES[0] ?? null);

  const handleSelectBadge = (badge: Badge) => {
    setSelectedBadge(badge);
    closeDialog();
  };

  const handleOpenBadges = () => {
    openDialog(
      <BadgeCollectionModal
        totalBadges={MOCK_BADGES}
        earnedBadgeIds={[
          'first-complete',
          'book-worm',
          'social-butterfly',
          'comment-rich',
          'first-sentence-killer',
          'critic',
        ]}
        selectedBadgeId={selectedBadge?.id ?? null}
        isOwner={isOwner}
        onSelect={handleSelectBadge}
      />,
    );
  };

  return (
    <div className="bg-primary flex flex-col items-center rounded-3xl px-4 pt-8 pb-4 text-center shadow-lg">
      <div className="mb-3.5">
        <Avatar
          profileImageUrl={user.profileImage}
          nickname={user.nickname}
          badge={selectedBadge ?? undefined}
          onClickBadge={handleOpenBadges}
        />
      </div>

      <div className="mb-6 flex flex-col gap-0.5">
        <p className="text-background text-xl font-semibold">{user.nickname}</p>
        {user.bio && <p className="text-primary-foreground text-sm">&quot;{user.bio}&quot;</p>}
      </div>

      <div className="flex w-full flex-col gap-2">
        <div className="flex justify-between gap-2">
          <div className="flex-1 rounded-xl bg-black/30 py-3">
            <p className="text-primary-foreground mb-1 text-xs">등록한 책</p>
            <b className="text-lg text-white">{bookCount}</b>
          </div>
          <button
            type="button"
            className="flex-1 cursor-pointer rounded-xl bg-black/30 py-3"
            onClick={() => openDialog(<FollowListModal userId={user.id} mode="followers" />)}
          >
            <p className="text-primary-foreground mb-1 text-xs">팔로워</p>
            <b className="text-lg text-white">{user.followerCount}</b>
          </button>
          <button
            type="button"
            className="flex-1 cursor-pointer rounded-xl bg-black/30 py-3"
            onClick={() => openDialog(<FollowListModal userId={user.id} mode="following" />)}
          >
            <p className="text-primary-foreground mb-1 text-xs">팔로잉</p>
            <b className="text-lg text-white">{user.followingCount}</b>
          </button>
        </div>

        {user.preferredGenres.length > 0 && (
          <div className="flex-1 rounded-xl bg-black/30 p-3">
            <p className="text-primary-foreground mb-2.5 text-xs">선호 장르</p>
            <div className="flex flex-wrap justify-center gap-2">
              {user.preferredGenres.map((genre) => (
                <GenreBadge key={genre} genre={genre} />
              ))}
            </div>
          </div>
        )}
      </div>

      {isLoggedIn && (
        <div className="mt-6 flex w-full gap-2">
          <ProfileActions isOwner={isOwner} userId={user.id} isFollowing={user.isFollowing} />
        </div>
      )}
    </div>
  );
}

// TODO: 팔로우/언팔로우 실패 처리
// TODO: 낙관적 업데이트 여부 확인

const ProfileActions = ({
  isOwner,
  userId,
  isFollowing: initialIsFollowing,
}: {
  isOwner: boolean;
  userId: string;
  isFollowing: boolean;
}) => {
  const router = useRouter();
  const clearToken = useAuthStore((state) => state.clearToken);

  const { isFollowing, isPending, toggleFollow } = useFollowToggle({
    userId,
    initialIsFollowing,
  });

  if (isOwner) {
    return (
      <>
        <Button
          variant="secondary"
          size="sm"
          className="text-primary bg-background flex-1 hover:bg-white"
          onClick={() => router.push(`/profile/${userId}/edit`)}
        >
          프로필 수정
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="flex-1"
          onClick={() => {
            clearToken();
            router.push('/profile');
          }}
        >
          로그아웃
        </Button>
      </>
    );
  }

  if (isFollowing) {
    return (
      <Button
        variant="secondary"
        size="sm"
        className="flex-1"
        disabled={isPending}
        onClick={toggleFollow}
      >
        언팔로우
      </Button>
    );
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      className="text-primary bg-background flex-1 hover:bg-white"
      disabled={isPending}
      onClick={toggleFollow}
    >
      팔로우
    </Button>
  );
};
