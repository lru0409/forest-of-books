import Link from 'next/link';
import { AlertCircle, LoaderCircle, UserRoundX } from 'lucide-react';

import { Modal } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { type FollowUser, useFollowToggle } from '@/lib';
import { useAuthStore } from '@/store/authStore';
import { useDialog } from '@/context/dialog';
import { useFollowList } from './useFollowList';
import { Avatar } from './Avatar';

interface FollowListModalProps {
  userId: string;
  mode: 'followers' | 'following';
}

export function FollowListModal({ userId, mode }: FollowListModalProps) {
  return (
    <Modal
      title={mode === 'followers' ? '팔로워' : '팔로잉'}
      content={<FollowListBody userId={userId} mode={mode} />}
    />
  );
}

function FollowListBody({ userId, mode }: FollowListModalProps) {
  const { items, viewState, isLoadingMore, hasMore, sentinelRef, patchItem } = useFollowList(
    userId,
    mode,
  );

  return (
    <div className="h-96 max-h-[60vh] overflow-y-auto">
      {viewState === 'loading' && (
        <FollowListStatus
          icon={
            <LoaderCircle className="size-8 animate-spin" strokeWidth={1.6} aria-hidden="true" />
          }
          description="불러오는 중이에요"
        />
      )}

      {viewState === 'error' && (
        <FollowListStatus
          icon={<AlertCircle className="size-8" strokeWidth={1.6} aria-hidden="true" />}
          description={'목록을 불러오지 못했어요.\n잠시 후 다시 시도해주세요.'}
        />
      )}

      {viewState === 'empty' && (
        <FollowListStatus
          icon={<UserRoundX className="size-8" strokeWidth={1.6} aria-hidden="true" />}
          description={mode === 'followers' ? '팔로워가 없어요' : '팔로잉이 없어요'}
        />
      )}

      {viewState === 'results' && (
        <div className="flex flex-col gap-1">
          {items.map((item) => (
            <FollowListRow key={item.id} item={item} onToggle={patchItem} />
          ))}
          {hasMore && (
            <div ref={sentinelRef} className="flex justify-center py-3">
              {isLoadingMore && (
                <LoaderCircle
                  className="text-muted-foreground size-4 animate-spin"
                  aria-hidden="true"
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FollowListStatus({ icon, description }: { icon?: React.ReactNode; description: string }) {
  return (
    <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-3 text-center text-sm">
      {icon}
      <p className="whitespace-pre-line">{description}</p>
    </div>
  );
}

// TODO: 팔로우/언팔로우 실패 처리
// TODO: 낙관적 업데이트 적용 여부 확인
// TODO: 팔로우/언팔로우 시 내 팔로잉 수 바로 갱신

function FollowListRow({
  item,
  onToggle,
}: {
  item: FollowUser;
  onToggle: (userId: string, isFollowing: boolean) => void;
}) {
  const { closeDialog } = useDialog();
  const isLoggedIn = useAuthStore((state) => state.token !== null);
  const currentUserId = useAuthStore((state) => state.user?.id);
  const isSelf = currentUserId === item.id;

  const { isFollowing, isPending, toggleFollow } = useFollowToggle({
    userId: item.id,
    initialIsFollowing: item.isFollowing,
    onChange: (next) => onToggle(item.id, next),
  });

  return (
    <div className="hover:bg-primary/8 relative flex items-center gap-3 rounded-lg p-2">
      <Link
        href={`/profile/${item.id}`}
        onClick={closeDialog}
        className="flex min-w-0 flex-1 items-center gap-3 after:absolute after:inset-0"
      >
        <Avatar profileImageUrl={item.profileImage} nickname={item.nickname} className="size-10" />

        <div className="min-w-0 flex-1 text-left">
          <p className="truncate text-sm font-semibold">{item.nickname}</p>
          {item.bio && <p className="text-muted-foreground truncate text-xs">{item.bio}</p>}
        </div>
      </Link>

      {isLoggedIn && !isSelf && (
        <Button
          type="button"
          variant={isFollowing ? 'secondary' : 'default'}
          size="xs"
          className="relative z-10"
          disabled={isPending}
          onClick={toggleFollow}
        >
          {isFollowing ? '언팔로우' : '팔로우'}
        </Button>
      )}

      {isSelf && (
        <div className="bg-primary/10 text-primary rounded-full px-2 py-1.5 text-xs font-bold">
          나
        </div>
      )}
    </div>
  );
}
