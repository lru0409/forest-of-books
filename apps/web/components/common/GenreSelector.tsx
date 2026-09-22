'use client';

import { Button } from '@/components/ui';
import { GENRE_LABELS, GENRES, type Genre } from '@/lib';

interface GenreSelectorProps {
  selected: Genre[];
  onToggle: (genre: Genre) => void;
}

export const GenreSelector = ({ selected, onToggle }: GenreSelectorProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      {GENRES.map((genre) => (
        <Button
          key={genre}
          type="button"
          size="sm"
          onClick={() => onToggle(genre)}
          variant={selected.includes(genre) ? 'default' : 'outline'}
          className="px-3 py-1.5 transition-colors"
        >
          {GENRE_LABELS[genre]}
        </Button>
      ))}
    </div>
  );
};
