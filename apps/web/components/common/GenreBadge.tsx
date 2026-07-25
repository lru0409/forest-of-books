import { GENRE_LABELS, type Genre } from '@/lib';

interface GenreBadgeProps {
  genre: Genre;
}

export function GenreBadge({ genre }: GenreBadgeProps) {
  return (
    <span className="border-primary/15 bg-primary-foreground text-primary rounded-full border px-3 py-1.5 text-xs">
      {GENRE_LABELS[genre]}
    </span>
  );
}
