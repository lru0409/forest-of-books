'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';

import { cn, useLocalStorage, useMediaQuery, type Book, type ReadingNote } from '@/lib';
import { Textarea } from '@/components/ui/textarea';
import { BookSummary } from './BookSummary';
import { RecordHeader } from './RecordHeader';
import { RecordSection } from './RecordSection';
import { RatingInput } from './RatingInput';
import { RatingStars } from './RatingStars';

const PANEL_DEFAULT_WIDTH = 672;
const PANEL_MIN_WIDTH = 400;
const PANEL_MAX_WIDTH_RATIO = 0.7;

export const PANEL_TRANSITION_MS = 300;

interface BookDetailAsideProps {
  book: Book;
  note: ReadingNote | undefined;
  onUpdateNote: (patch: Partial<ReadingNote>) => void;
  isClosing: boolean;
  isEntering: boolean;
}

export const BookDetailAside = ({
  book,
  note,
  onUpdateNote,
  isClosing,
  isEntering,
}: BookDetailAsideProps) => {
  const isMobile = !useMediaQuery('md');
  const [isFullscreen, setIsFullscreen] = useLocalStorage('notes-book-detail-fullscreen', false);
  const isFullscreenView = isMobile || isFullscreen;

  const [panelWidth, setPanelWidth] = useState(PANEL_DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    if (!isResizing) return;

    const maxWidth = window.innerWidth * PANEL_MAX_WIDTH_RATIO;

    const handleMouseMove = (e: MouseEvent) => {
      const nextWidth = window.innerWidth - e.clientX;
      setPanelWidth(Math.min(Math.max(nextWidth, PANEL_MIN_WIDTH), maxWidth));
    };
    const handleMouseUp = () => setIsResizing(false);

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  return (
    <div
      className={cn(
        'z-50 transition-all ease-in-out',
        isFullscreenView
          ? 'fixed inset-0'
          : 'fixed inset-0 md:sticky md:inset-auto md:top-0 md:h-screen md:w-(--panel-width) md:translate-x-0 md:self-start',
        !isFullscreenView && !isResizing && 'md:transition-[width]',
        !isFullscreenView && isResizing && 'transition-none',
        (isClosing || isEntering) && 'translate-x-full overflow-hidden',
      )}
      style={
        {
          '--panel-width': `${isClosing || isEntering ? 0 : panelWidth}px`,
          transitionDuration: `${PANEL_TRANSITION_MS}ms`,
        } as React.CSSProperties
      }
    >
      {!isFullscreenView && <ResizeHandle onResizeStart={() => setIsResizing(true)} />}
      <BookDetailPanel
        book={book}
        note={note}
        onUpdateNote={onUpdateNote}
        isFullscreen={isFullscreenView}
        showFullscreenToggle={!isMobile}
        onToggleFullscreen={() => setIsFullscreen(!isFullscreenView)}
      />
    </div>
  );
};

function ResizeHandle({ onResizeStart }: { onResizeStart: () => void }) {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="상세 패널 너비 조절"
      onMouseDown={(e) => {
        e.preventDefault();
        onResizeStart();
      }}
      className="hover:bg-primary/30 absolute top-0 left-0 z-10 hidden h-full w-1.5 -translate-x-1/2 cursor-col-resize transition-colors md:block"
    />
  );
}

export function BookDetailPanel({
  book,
  note,
  onUpdateNote,
  isFullscreen,
  showFullscreenToggle,
  onToggleFullscreen,
}: {
  book: Book;
  note: ReadingNote | undefined;
  onUpdateNote: (patch: Partial<ReadingNote>) => void;
  isFullscreen: boolean;
  showFullscreenToggle: boolean;
  onToggleFullscreen: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isEditing, setIsEditing] = useState(false);

  const handleClose = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('book');
    if (params.size === 0) {
      router.push(pathname, { scroll: false });
      return;
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

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
    <div className="border-primary/15 h-full w-full flex-col overflow-y-auto overscroll-contain border-l bg-white px-2 pt-3.5 pb-6 md:px-3.5 md:pt-5 md:pb-8">
      <div className="mb-4 flex items-center gap-1">
        <button
          type="button"
          aria-label="상세 패널 닫기"
          onClick={handleClose}
          className="hover:bg-primary-foreground/50 flex size-9 cursor-pointer items-center justify-center rounded-full transition-colors"
        >
          {isFullscreen ? (
            <ChevronLeft className="size-5" aria-hidden="true" />
          ) : (
            <ChevronRight className="size-5" aria-hidden="true" />
          )}
        </button>
        {showFullscreenToggle && (
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
        )}
      </div>

      <div className="mx-auto w-full max-w-2xl min-w-2xs px-4">
        <BookSummary
          book={book}
          color={note.color}
          status={note.status}
          onStatusChange={(status) => onUpdateNote({ status })}
        />

        <div className="border-primary/20 mt-8 mb-6 flex flex-1 border-t" />

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
