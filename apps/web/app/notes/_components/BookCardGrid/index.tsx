import { Book } from '../../types';
import { Item } from './Item';

interface BookCardGridProps {
  books: Book[];
}

export function BookCardGrid({ books }: BookCardGridProps) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-3.5 px-1 md:gap-5 md:px-4">
      {books.map((book, index) => (
        <Item key={book.id} book={book} index={index} />
      ))}
    </div>
  );
}
