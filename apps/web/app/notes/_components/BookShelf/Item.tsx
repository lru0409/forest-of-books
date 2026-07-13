import { Book } from '../../types';

interface ItemProps {
  book: Book;
}

export function Item({ book }: ItemProps) {
  return (
    <div
      className="flex h-50 w-12 cursor-pointer rounded-sm shadow-md transition-transform duration-200 ease-out hover:-translate-y-3"
      title={`${book.title} — ${book.author}`}
      style={{ backgroundColor: book.color }}
    >
      {/* 책등 왼쪽 하이라이트 */}
      <div className="h-full w-2 rounded-l-sm bg-white/15" />

      {/* 제목 */}
      <div className="flex h-full flex-1 items-center justify-center py-4">
        <span className="max-h-full overflow-hidden text-[14px] tracking-[0.18em] text-ellipsis whitespace-nowrap text-white [text-orientation:upright] [word-spacing:-0.6em] [writing-mode:vertical-rl]">
          {book.title}
        </span>
      </div>
    </div>
  );
}
