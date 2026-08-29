import { type LibraryEntryListItem } from '@/lib';
import { Item } from './Item';

interface BookCardGridProps {
  items: LibraryEntryListItem[];
}

export function BookCardGrid({ items }: BookCardGridProps) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-3.5 md:gap-5">
      {items.map((item, index) => (
        <Item key={item.id} item={item} index={index} />
      ))}
    </div>
  );
}
