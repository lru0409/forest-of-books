'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { GenreBadge } from '@/components/common';
import { MOCK_BADGES, type Badge, type User } from '@/lib';
import { useAuthStore } from '@/store/authStore';
import { useDialog } from '@/context/dialog';
import { Avatar } from './Avatar';
import { BadgeCollectionModal } from './BadgeCollectionModal';

interface ProfileCardProps {
  user: User;
  isOwner: boolean;
  bookCount: number;
}

export function ProfileCard({ user, isOwner, bookCount }: ProfileCardProps) {
  const { openDialog, closeDialog } = useDialog();

  // TODO: 뱃지 API 연동 시 유저별 획득/선택 뱃지로 교체
  const MOCK_EARNED_BADGE_IDS = MOCK_BADGES.slice(0, 4).map((badge) => badge.id);
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

      <div className="mb-6 flex w-full flex-col gap-2">
        <div className="flex justify-between gap-2">
          <div className="flex-1 rounded-xl bg-black/30 py-3">
            <p className="text-primary-foreground mb-1 text-xs">등록한 책</p>
            <b className="text-lg text-white">{bookCount}</b>
          </div>
          <div className="flex-1 rounded-xl bg-black/30 py-3">
            <p className="text-primary-foreground mb-1 text-xs">팔로워</p>
            <b className="text-lg text-white">0</b>
          </div>
          <div className="flex-1 rounded-xl bg-black/30 py-3">
            <p className="text-primary-foreground mb-1 text-xs">팔로잉</p>
            <b className="text-lg text-white">0</b>
          </div>
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

      <div className="flex w-full gap-2">
        <ProfileActions isOwner={isOwner} />
      </div>
    </div>
  );
}

const ProfileActions = ({ isOwner }: { isOwner: boolean }) => {
  const router = useRouter();
  const clearToken = useAuthStore((state) => state.clearToken);
  const clearUser = useAuthStore((state) => state.clearUser);

  // TODO: 팔로우 API 연동
  const [isFollowing, setIsFollowing] = useState(false);

  const handleLogout = () => {
    clearToken();
    clearUser();
    router.push('/');
  };

  if (isOwner) {
    return (
      <>
        <Button
          variant="secondary"
          size="sm"
          className="text-primary bg-background flex-1 hover:bg-white"
        >
          프로필 수정
        </Button>
        <Button variant="secondary" size="sm" className="flex-1" onClick={handleLogout}>
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
        onClick={() => setIsFollowing(false)}
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
      onClick={() => setIsFollowing(true)}
    >
      팔로우
    </Button>
  );
};
