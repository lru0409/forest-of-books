'use client';

import { useEffect, useState } from 'react';

import {
  cn,
  useLocalStorage,
  useMediaQuery,
  type LibraryEntryListItem,
  type LibraryEntryNotePatch,
  type ReadingStatus,
} from '@/lib';
import { Button } from '@/components/ui';
import { Modal } from '@/components/layout';
import { useDialog } from '@/context/dialog';

import { PanelToolBar } from './PanelToolBar';
import { BookSummary } from './BookSummary';
import { RecordView } from './RecordView';

const PANEL_DEFAULT_WIDTH = 672;
const PANEL_MIN_WIDTH = 400;
const PANEL_MAX_WIDTH_RATIO = 0.7;

export const PANEL_TRANSITION_MS = 300;

interface BookDetailAsideProps {
  item: LibraryEntryListItem;
  updateItem: (patch: LibraryEntryNotePatch) => Promise<boolean>;
  deleteItem: () => Promise<boolean>;
  isClosing: boolean;
  isEntering: boolean;
}

export const BookDetailAside = ({
  item,
  updateItem,
  deleteItem,
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
        item={item}
        updateItem={updateItem}
        deleteItem={deleteItem}
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

function BookDetailPanel({
  item,
  updateItem,
  deleteItem,
  isFullscreen,
  showFullscreenToggle,
  onToggleFullscreen,
}: {
  item: LibraryEntryListItem;
  updateItem: (patch: LibraryEntryNotePatch) => Promise<boolean>;
  deleteItem: () => Promise<boolean>;
  isFullscreen: boolean;
  showFullscreenToggle: boolean;
  onToggleFullscreen: () => void;
}) {
  const { openDialog, closeDialog } = useDialog();

  const showSaveErrorDialog = () => {
    openDialog(
      <Modal
        title={'저장에 실패했어요.\n잠시 후 다시 시도해주세요.'}
        buttons={[
          <Button key="close" onClick={closeDialog}>
            확인
          </Button>,
        ]}
        showCloseButton={false}
      />,
    );
  };

  const handleStatusChange = async (status: ReadingStatus) => {
    const success = await updateItem({ status });
    if (!success) showSaveErrorDialog();
  };

  return (
    <div className="border-primary/15 h-full w-full flex-col overflow-y-auto overscroll-contain border-l bg-white px-2 pt-3.5 pb-6 md:px-3.5 md:pt-5 md:pb-8">
      <PanelToolBar
        isFullscreen={isFullscreen}
        showFullscreenToggle={showFullscreenToggle}
        onToggleFullscreen={onToggleFullscreen}
        deleteItem={deleteItem}
      />
      <div className="mx-auto w-full max-w-2xl min-w-2xs px-4">
        <BookSummary item={item} onStatusChange={handleStatusChange} />
        <div className="border-primary/20 mt-8 mb-6 flex flex-1 border-t" />
        <RecordView itemId={item.id} updateItem={updateItem} isPublic={item.isPublic} />
      </div>
    </div>
  );
}
