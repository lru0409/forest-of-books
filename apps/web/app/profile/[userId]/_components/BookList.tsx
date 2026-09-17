import { BookOpen, Eye, EyeOff } from 'lucide-react';

import { type LibraryEntryListItem } from '@/lib';
import { StatusNotice, ReadingStatusBadge, BookCover, GenreBadge } from '@/components/common';

interface BookListProps {
  items: LibraryEntryListItem[];
  isOwner: boolean;
}

export function BookList({ items, isOwner }: BookListProps) {
  if (items.length === 0) {
    return (
      <StatusNotice
        className="flex-1"
        icon={<BookOpen className="text-primary size-14" strokeWidth={1.2} aria-hidden="true" />}
        title="등록한 책이 없어요"
      />
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {items.map((item) => (
        <Item key={item.id} item={item} isOwner={isOwner} />
      ))}
    </div>
  );
}

// TODO: 클릭 시 처리
export function Item({ item, isOwner }: { item: LibraryEntryListItem; isOwner: boolean }) {
  const { title, author, genre, status, color, coverUrl, isPublic } = item;

  return (
    <div
      className="bg-card flex items-center gap-5 rounded-xl p-3 pr-4.5 shadow-sm"
      title={`${title} — ${author}`}
    >
      <BookCover coverUrl={coverUrl} title={title} color={color} />

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <h3 className="text-primary text-md line-clamp-2 font-semibold">{title}</h3>
        </div>
        <p className="text-secondary truncate text-sm">{author}</p>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {isOwner && (
          <div className="border-primary/15 bg-muted text-foreground flex h-7.5 w-7.5 items-center justify-center rounded-full border">
            {isPublic ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
          </div>
        )}
        <div className="hidden sm:block">
          <ReadingStatusBadge status={status} />
        </div>
        <div className="hidden sm:block">
          <GenreBadge genre={genre} />
        </div>
      </div>
    </div>
  );
}
