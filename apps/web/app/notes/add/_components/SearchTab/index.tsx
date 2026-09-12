'use client';

import { useState } from 'react';
import { SearchX, LoaderCircle, Search, CircleX } from 'lucide-react';

import { BookColorPicker, BookCover, SearchInput, StatusNotice } from '@/components/common';
import { Button } from '@/components/ui';
import { Modal } from '@/components/layout';
import { useDialog } from '@/context/dialog';
import type { Book } from '@/lib';
import { useBookSearch } from './useBookSearch';

interface SearchTabProps {
  onAdd: (book: Book, color: string) => Promise<'success' | 'conflict' | 'error'>;
  onGoToManual: () => void;
}

export function SearchTab({ onAdd, onGoToManual }: SearchTabProps) {
  const { openDialog, closeDialog } = useDialog();
  const { query, setQuery, results, error, isLoadingMore, hasMore, viewState, sentinelRef } =
    useBookSearch();

  const handleConfirmAdd = async (book: Book, color: string) => {
    const result = await onAdd(book, color);
    if (result === 'success') {
      closeDialog();
      return;
    }

    if (result === 'conflict') {
      openDialog(
        <Modal
          title="이미 서재에 등록된 책이에요."
          buttons={[
            <Button key="close" onClick={closeDialog}>
              확인
            </Button>,
          ]}
          showCloseButton={false}
        />,
      );
      return;
    }

    openDialog(
      <Modal
        title={'등록에 실패했어요.\n잠시 후 다시 시도해주세요.'}
        buttons={[
          <Button key="close" onClick={closeDialog}>
            확인
          </Button>,
        ]}
        showCloseButton={false}
      />,
    );
  };

  return (
    <div className="flex flex-1 flex-col gap-4">
      <SearchInput
        autoFocus
        value={query}
        onChange={setQuery}
        placeholder="제목 또는 저자로 검색하세요."
      />
      <div className="flex flex-1 flex-col">
        {viewState === 'idle' && (
          <StatusNotice
            className="flex-1"
            icon={<Search className="text-primary size-10" strokeWidth={2.5} aria-hidden="true" />}
            title="등록하고 싶은 책을 검색하세요."
          />
        )}
        {viewState === 'loading' && (
          <StatusNotice
            className="flex-1"
            icon={
              <LoaderCircle
                className="text-primary size-9 animate-spin"
                strokeWidth={2.5}
                aria-hidden="true"
              />
            }
            title="불러오는 중..."
          />
        )}
        {viewState === 'empty' && (
          <StatusNotice
            className="flex-1"
            icon={<CircleX className="text-primary size-12" strokeWidth={1.6} aria-hidden="true" />}
            title="검색 결과가 없어요."
            description="직접 입력해서 등록해주세요"
            action={
              <Button size="sm" className="mt-2" onClick={onGoToManual}>
                직접 입력하기
              </Button>
            }
          />
        )}
        {viewState === 'error' && (
          <StatusNotice
            className="flex-1"
            icon={<SearchX className="text-primary size-12" strokeWidth={2} aria-hidden="true" />}
            title={error ?? '오류가 발생했어요.'}
          />
        )}
        {viewState === 'results' && (
          <div className="flex flex-col gap-1">
            {results.map((book) => (
              <button
                key={book.id}
                type="button"
                onClick={() =>
                  openDialog(
                    <ColorSelectModal onConfirm={(color) => handleConfirmAdd(book, color)} />,
                  )
                }
                className="hover:bg-primary/8 flex w-full cursor-pointer items-center gap-4 rounded-lg p-2 text-left transition-colors"
              >
                <BookCover coverUrl={book.coverUrl ?? null} title={book.title} />
                <div className="flex flex-1 flex-col gap-1">
                  <span className="line-clamp-2 text-base font-semibold">{book.title}</span>
                  <span className="text-secondary line-clamp-1 text-sm">
                    {book.author}
                    {book.publisher ? ` | ${book.publisher}` : ''}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
        {hasMore && (
          <div ref={sentinelRef} className="flex items-center justify-center gap-1.5 py-6">
            {isLoadingMore && (
              <>
                <LoaderCircle className="text-secondary size-5 animate-spin" strokeWidth={4} />
                <p className="text-secondary text-sm">불러오는 중...</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ColorSelectModal({ onConfirm }: { onConfirm: (color: string) => Promise<void> }) {
  const [color, setColor] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirmClick = async () => {
    if (color === null || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onConfirm(color);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      title="색상을 선택해주세요"
      content={<BookColorPicker value={color} onChange={setColor} disabled={isSubmitting} />}
      buttons={[
        <Button
          key="confirm"
          disabled={color === null || isSubmitting}
          isLoading={isSubmitting}
          onClick={handleConfirmClick}
        >
          등록
        </Button>,
      ]}
      showCloseButton={!isSubmitting}
      preventClose={isSubmitting}
    />
  );
}
