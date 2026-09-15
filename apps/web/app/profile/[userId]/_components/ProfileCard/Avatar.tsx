import { User } from 'lucide-react';

import { type Badge } from '@/lib';

interface AvatarProps {
  profileImageUrl: string;
  nickname: string;
  badge?: Badge;
  onClickBadge?: () => void;
}

export function Avatar({ profileImageUrl, nickname, badge, onClickBadge }: AvatarProps) {
  return (
    <div className="relative">
      {profileImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={profileImageUrl}
          alt={nickname}
          className="size-36 rounded-full object-cover shadow-md"
        />
      ) : (
        <div className="bg-background flex size-36 items-center justify-center rounded-full shadow-md">
          <User className="text-primary size-14" />
        </div>
      )}

      {badge && (
        <button
          type="button"
          aria-label="뱃지 콜렉션 보기"
          onClick={onClickBadge}
          className="absolute right-0 bottom-0 flex size-12 cursor-pointer items-center justify-center rounded-full border-3"
          style={{ backgroundImage: badge.bgGradient }}
        >
          <badge.icon className="size-6 text-white" />
        </button>
      )}
    </div>
  );
}
