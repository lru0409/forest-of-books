'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

import { Container } from '@/components/layout';
import { SegmentedToggle, type SegmentedToggleOption } from '@/components/common';
import { type Book } from '@/lib';
import { useAuthStore } from '@/store/authStore';
import LibraryService from '@/services/library';
import { SearchTab, ManualTab } from './_components';
import { type Mode } from './types';

const MODE_OPTIONS: SegmentedToggleOption<Mode>[] = [
  { value: 'search', label: '검색' },
  { value: 'manual', label: '직접 입력' },
];

export default function AddBookPage() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const [mode, setMode] = useState<Mode>('search');

  const handleAdd = async (book: Omit<Book, 'id'>, color: string) => {
    if (!token) return false;

    const result = await LibraryService.createEntry(book, color, token);
    if (result.isSuccess) {
      router.push('/notes');
      return true;
    }
    return false;
  };

  return (
    <Container className="flex justify-center pb-8 md:pb-0">
      <div className="relative mt-16 flex w-125 min-w-80 flex-col pb-10">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-secondary hover:text-primary absolute -top-9.5 left-0 flex cursor-pointer items-center gap-0.5 text-sm font-medium transition-colors"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          돌아가기
        </button>
        <h1 className="mb-2 text-3xl font-bold">책 등록하기</h1>
        <p className="text-secondary mb-3 text-base">검색해서 등록하거나 직접 입력해주세요.</p>
        <div className="mb-4">
          <SegmentedToggle
            value={mode}
            onChange={setMode}
            options={MODE_OPTIONS}
            ariaLabel="책 등록 방식"
            fullWidth
          />
        </div>
        <div className="flex flex-1 flex-col">
          {mode === 'search' ? (
            <SearchTab onAdd={handleAdd} onGoToManual={() => setMode('manual')} />
          ) : (
            <ManualTab onAdd={handleAdd} />
          )}
        </div>
      </div>
    </Container>
  );
}
