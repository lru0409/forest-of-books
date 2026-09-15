import { Modal } from '@/components/layout';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { cn, type Badge } from '@/lib';

interface BadgeCollectionModalProps {
  totalBadges: Badge[];
  earnedBadgeIds: string[];
  selectedBadgeId: string | null;
  isOwner: boolean;
  onSelect?: (badge: Badge) => void;
}

export function BadgeCollectionModal({
  totalBadges,
  earnedBadgeIds,
  selectedBadgeId,
  isOwner,
  onSelect,
}: BadgeCollectionModalProps) {
  return (
    <Modal
      title="획득한 뱃지"
      content={
        <BadgeGrid
          totalBadges={totalBadges}
          earnedBadgeIds={earnedBadgeIds}
          selectedBadgeId={selectedBadgeId}
          isOwner={isOwner}
          onSelect={onSelect}
        />
      }
    />
  );
}

function BadgeGrid({
  totalBadges,
  earnedBadgeIds,
  selectedBadgeId,
  isOwner,
  onSelect,
}: BadgeCollectionModalProps) {
  return (
    <TooltipProvider>
      <div className="grid grid-cols-4 gap-3 p-3">
        {totalBadges.map((badge) => {
          const isEarned = earnedBadgeIds.includes(badge.id);
          const isSelected = badge.id === selectedBadgeId;

          return (
            <Tooltip key={badge.id} disableHoverableContent>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    'group relative flex flex-col items-center justify-center gap-0 rounded-lg py-1 text-center',
                    isOwner && isEarned && 'cursor-pointer',
                    isOwner && !isEarned && 'cursor-not-allowed',
                  )}
                  onClick={() => {
                    if (isOwner && isEarned && onSelect) onSelect(badge);
                  }}
                >
                  <span
                    className={cn(
                      'mb-1.5 flex size-15 items-center justify-center rounded-full transition-shadow',
                      !isEarned && 'bg-muted',
                      isEarned &&
                        isSelected &&
                        'shadow-[0_0_16px_6px_color-mix(in_srgb,var(--glow)_50%,transparent)]',
                      isEarned &&
                        'group-hover:shadow-[0_0_16px_6px_color-mix(in_srgb,var(--glow)_50%,transparent)]',
                    )}
                    style={
                      isEarned
                        ? ({
                            backgroundImage: badge.bgGradient,
                            '--glow': badge.glowColor,
                          } as React.CSSProperties)
                        : undefined
                    }
                  >
                    <badge.icon
                      className={cn('size-8', isEarned ? 'text-white' : 'text-muted-foreground')}
                    />
                  </span>
                  <span
                    className={cn(
                      'line-clamp-1 text-xs font-semibold',
                      isEarned ? 'text-black' : 'text-muted-foreground',
                    )}
                  >
                    {badge.title}
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-muted" arrowClassName="fill-muted">
                {badge.description}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
