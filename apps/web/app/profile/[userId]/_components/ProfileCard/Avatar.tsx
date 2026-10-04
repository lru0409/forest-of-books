import { User } from 'lucide-react';

import { type Badge } from '@/lib';
import { cn } from '@/lib/utils';

interface AvatarProps {
  profileImageUrl: string;
  nickname: string;
  badge?: Badge;
  onClickBadge?: () => void;
  className?: string;
}

export function Avatar({ profileImageUrl, nickname, badge, onClickBadge, className }: AvatarProps) {
  return (
    <div className="relative">
      {profileImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={profileImageUrl}
          alt={nickname}
          className={cn('size-36 rounded-full object-cover shadow-md', className)}
        />
      ) : (
        <div
          className={cn(
            'bg-background text-primary flex size-36 items-center justify-center rounded-full shadow-md',
            className,
          )}
        >
          <User className="size-2/5" />
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
