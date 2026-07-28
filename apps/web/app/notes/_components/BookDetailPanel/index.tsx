'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';

import { type Book, type ReadingNote } from '@/lib';
import { Textarea } from '@/components/ui/textarea';
import { BookSummary } from './BookSummary';
import { RecordHeader } from './RecordHeader';
import { RecordSection } from './RecordSection';
import { RatingInput } from './RatingInput';
import { RatingStars } from './RatingStars';

interface BookDetailPanelProps {
  book: Book;
  note: ReadingNote | undefined;
  onUpdateNote: (patch: Partial<ReadingNote>) => void;
  onClose: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export function BookDetailPanel({
  book,
  note,
  onUpdateNote,
  onClose,
  isFullscreen,
  onToggleFullscreen,
}: BookDetailPanelProps) {
  const [isEditing, setIsEditing] = useState(false);

  const startEditing = () => setIsEditing(true);

  const finishEditing = () => {
    const now = new Date().toISOString();
    onUpdateNote({ updatedAt: now, createdAt: note?.createdAt ?? now });
    setIsEditing(false);
  };

  if (!note) {
    // TODO: 에러 처리
    return null;
  }

  return (
    <div className="border-primary/15 h-full w-full flex-col overflow-y-auto overscroll-contain border-l bg-white px-3.5 pt-5 pb-4">
      <div className="mb-4 flex items-center gap-1">
        <button
          type="button"
          aria-label="상세 패널 닫기"
          onClick={onClose}
          className="hover:bg-primary-foreground/50 flex size-9 cursor-pointer items-center justify-center rounded-full transition-colors"
        >
          {isFullscreen ? (
            <ChevronLeft className="size-5" aria-hidden="true" />
          ) : (
            <ChevronRight className="size-5" aria-hidden="true" />
          )}
        </button>
        <button
          type="button"
          aria-label={isFullscreen ? '전체화면 종료' : '전체화면으로 보기'}
          onClick={onToggleFullscreen}
          className="hover:bg-primary-foreground/50 flex size-9 cursor-pointer items-center justify-center rounded-full transition-colors"
        >
          {isFullscreen ? (
            <Minimize2 className="size-4" aria-hidden="true" />
          ) : (
            <Maximize2 className="size-4" aria-hidden="true" />
          )}
        </button>
      </div>

      <div className="mx-auto w-full max-w-2xl min-w-2xs px-4">
        <BookSummary
          book={book}
          color={note.color}
          status={note.status}
          onStatusChange={(status) => onUpdateNote({ status })}
        />

        <div className="border-primary/20 mt-8 mb-6 flex flex-1 border-t"></div>

        <RecordHeader
          createdAt={note.createdAt}
          updatedAt={note.updatedAt}
          isEditing={isEditing}
          onToggleEdit={isEditing ? finishEditing : startEditing}
        />

        <div className="flex flex-col gap-4">
          <RecordSection
            title="평점"
            isEditing={isEditing}
            hasValue={!!note.rating}
            emptyMessage="아직 평점을 남기지 않았어요."
            editor={
              <RatingInput
                rating={note.rating ?? 0}
                onChange={(rating) => onUpdateNote({ rating })}
              />
            }
            display={<RatingStars value={note.rating ?? 0} />}
          />

          <RecordSection
            title="한줄평"
            isEditing={isEditing}
            hasValue={!!note.comment}
            emptyMessage="아직 한줄평을 남기지 않았어요."
            editor={
              <Textarea
                value={note.comment ?? ''}
                onChange={(e) => onUpdateNote({ comment: e.target.value })}
                placeholder="이 책에 대한 한줄평을 남겨보세요."
                maxLength={100}
                showCounter
              />
            }
            display={<p className="text-sm text-black">{note.comment}</p>}
          />

          <RecordSection
            title="자유 기록"
            isEditing={isEditing}
            hasValue={!!note.note}
            emptyMessage="아직 기록을 남기지 않았어요."
            editor={
              <Textarea
                value={note.note ?? ''}
                onChange={(e) => onUpdateNote({ note: e.target.value })}
                placeholder="자유롭게 기록을 남겨보세요."
                className="flex-1"
                maxLength={2000}
                showCounter
              />
            }
            display={<p className="text-sm whitespace-pre-wrap text-black">{note.note}</p>}
          />
        </div>
      </div>
    </div>
  );
}
