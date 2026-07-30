'use client';

import { Search, Plus } from 'lucide-react';

import { Input } from '@/components/ui/input';
import {
  GENRES,
  GENRE_LABELS,
  READING_STATUS_LABELS,
  READING_STATUS_ICONS,
  READING_STATUSES,
  type Genre,
  type ReadingStatus,
} from '@/lib';
import { MultiSelectFilter } from '@/components/common';
import type { ViewMode } from '../../types';
import { ViewToggle } from './ViewToggle';

interface FilterBarProps {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  selectedGenres: Genre[];
  onSelectedGenresChange: (genres: Genre[]) => void;
  selectedStatuses: ReadingStatus[];
  onSelectedStatusesChange: (statuses: ReadingStatus[]) => void;
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

export function FilterBar({
  searchQuery,
  onSearchQueryChange,
  selectedGenres,
  onSelectedGenresChange,
  selectedStatuses,
  onSelectedStatusesChange,
  view,
  onViewChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Input
        value={searchQuery}
        onChange={(e) => onSearchQueryChange(e.target.value)}
        placeholder="제목 또는 저자로 검색하세요."
        prefix={
          <div className="flex items-center">
            <Search className="text-primary size-4" aria-hidden="true" />
          </div>
        }
        className="min-w-65 flex-1"
      />
      <div className="flex flex-wrap items-center gap-2">
        <MultiSelectFilter
          label="장르"
          options={GENRES.map((genre) => ({ value: genre, label: GENRE_LABELS[genre] }))}
          selected={selectedGenres}
          onChange={(genres) => onSelectedGenresChange(genres as Genre[])}
        />
        <MultiSelectFilter
          label="읽기 상태"
          options={READING_STATUSES.map((status) => ({
            value: status,
            label: READING_STATUS_LABELS[status],
            icon: READING_STATUS_ICONS[status],
          }))}
          selected={selectedStatuses}
          onChange={(statuses) => onSelectedStatusesChange(statuses as ReadingStatus[])}
        />
        <ViewToggle view={view} onChange={onViewChange} />
        <button className="border-primary/30 bg-primary/8 text-primary hover:bg-primary hover:text-primary-foreground flex h-9.5 w-9.5 cursor-pointer items-center justify-center rounded-full border transition-colors">
          <Plus className="size-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
