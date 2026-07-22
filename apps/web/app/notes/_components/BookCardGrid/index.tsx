import { type Book } from '@/lib';
import { Item } from './Item';

interface BookCardGridProps {
  books: Book[];
}

export function BookCardGrid({ books }: BookCardGridProps) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-3.5 md:gap-5">
      {books.map((book, index) => (
        <Item key={book.id} book={book} index={index} />
      ))}
    </div>
  );
}
