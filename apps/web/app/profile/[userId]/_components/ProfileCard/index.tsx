'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Pencil } from 'lucide-react';

import { Modal } from '@/components/layout';
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
  onUserNotFound: () => void;
  onProfileRefresh: () => void;
}

export function ProfileCard({
  user,
  isOwner,
  bookCount,
  onUserNotFound,
  onProfileRefresh,
}: ProfileCardProps) {
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
    <div className="bg-primary relative flex flex-col items-center rounded-3xl px-4 pt-8 pb-4 text-center shadow-lg">
      {isOwner && (
        <Link
          href="/profile/edit"
          aria-label="프로필 수정"
          className="text-primary-foreground hover:bg-primary-foreground/20 absolute top-3 right-3 flex size-8 items-center justify-center rounded-full transition-colors"
        >
          <Pencil className="size-4" aria-hidden="true" />
        </Link>
      )}
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
            onClick={() =>
              openDialog(
                <FollowListModal
                  userId={user.id}
                  mode="followers"
                  isOwner={isOwner}
                  onProfileRefresh={onProfileRefresh}
                />,
              )
            }
          >
            <p className="text-primary-foreground mb-1 text-xs">팔로워</p>
            <b className="text-lg text-white">{user.followerCount}</b>
          </button>
          <button
            type="button"
            className="flex-1 cursor-pointer rounded-xl bg-black/30 py-3"
            onClick={() =>
              openDialog(
                <FollowListModal
                  userId={user.id}
                  mode="following"
                  isOwner={isOwner}
                  onProfileRefresh={onProfileRefresh}
                />,
              )
            }
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

      {isLoggedIn && !isOwner && (
        <div className="mt-6 flex w-full gap-2">
          <ProfileActions
            userId={user.id}
            isFollowing={user.isFollowing}
            onUserNotFound={onUserNotFound}
            onProfileRefresh={onProfileRefresh}
          />
        </div>
      )}
    </div>
  );
}

const ProfileActions = ({
  userId,
  isFollowing: initialIsFollowing,
  onUserNotFound,
  onProfileRefresh,
}: {
  userId: string;
  isFollowing: boolean;
  onUserNotFound: () => void;
  onProfileRefresh: () => void;
}) => {
  const { openDialog, closeDialog } = useDialog();

  const { isFollowing, isPending, toggleFollow } = useFollowToggle({
    userId,
    initialIsFollowing,
    onChange: onProfileRefresh,
    onError: ({ statusCode, action }) => {
      const isNotFound = statusCode === 404;
      // 삭제된 유저라서 팔로우할 수 없으므로 화면도 not-found로 바꿈
      if (isNotFound) onUserNotFound();
      const title = isNotFound
        ? '존재하지 않는 사용자예요.'
        : `${action === 'follow' ? '팔로우' : '언팔로우'}가 실패했어요.\n잠시 후 다시 시도해주세요.`;
      openDialog(
        <Modal
          title={title}
          buttons={[
            <Button key="close" onClick={closeDialog}>
              확인
            </Button>,
          ]}
          showCloseButton={false}
        />,
      );
    },
  });

  if (isFollowing) {
    return (
      <Button
        variant="secondary"
        size="sm"
        className="min-h-10.5 flex-1"
        isLoading={isPending}
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
      className="text-primary bg-background min-h-10.5 flex-1 hover:bg-white"
      isLoading={isPending}
      onClick={toggleFollow}
    >
      팔로우
    </Button>
  );
};
