'use client';

import { Search, Plus, Rows3, LayoutGrid } from 'lucide-react';

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
import { MultiSelectFilter, SegmentedToggle, type SegmentedToggleOption } from '@/components/common';
import type { ViewMode } from '../../types';

const VIEW_OPTIONS: SegmentedToggleOption<ViewMode>[] = [
  { value: 'shelf', label: '책장', icon: Rows3 },
  { value: 'card', label: '카드', icon: LayoutGrid },
];

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
    <div className="flex flex-wrap items-center gap-2 md:gap-4">
      <Input
        value={searchQuery}
        onChange={(e) => onSearchQueryChange(e.target.value)}
        placeholder="제목 또는 저자로 검색하세요."
        prefix={
          <div className="flex items-center">
            <Search className="text-primary size-4" aria-hidden="true" />
          </div>
        }
        className="min-w-full flex-1 md:min-w-75"
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
        <button className="border-primary/30 bg-primary/8 text-primary hover:bg-primary hover:text-primary-foreground flex h-7.5 w-7.5 cursor-pointer items-center justify-center rounded-full border transition-colors md:h-9.5 md:w-9.5">
        <SegmentedToggle
          value={view}
          onChange={onViewChange}
          options={VIEW_OPTIONS}
          ariaLabel="책 목록 보기 방식"
        />
          <Plus className="size-4 md:size-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
