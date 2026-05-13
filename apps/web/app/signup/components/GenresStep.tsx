'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui';
import { GENRES } from '@/lib';

export const GenresStep = ({ onComplete }: { onComplete: () => void }) => {
  const router = useRouter();

  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  const toggle = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre],
    );
  };

  return (
    <div className="flex flex-1 flex-col justify-between">
      <div>
        <h1 className="mb-2 text-3xl font-bold">선호 장르</h1>
        <p className="text-secondary mb-8 text-base">좋아하는 장르를 선택해 주세요.</p>

        <div className="flex flex-wrap gap-2">
          {GENRES.map((genre) => (
            <Button
              key={genre}
              size="sm"
              onClick={() => toggle(genre)}
              variant={selectedGenres.includes(genre) ? 'default' : 'outline'}
              className={'px-3 py-1.5 transition-colors'}
            >
              {genre}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={() => router.back()}>
          이전
        </Button>
        <Button className="flex-1" onClick={onComplete}>
          완료
        </Button>
      </div>
    </div>
  );
};
