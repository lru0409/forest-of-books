import type { Genre, ReadingStatus } from './book';

export interface LibraryEntryListItem {
  id: string;
  title: string;
  author: string;
  genre: Genre;
  coverUrl: string | null;
  status: ReadingStatus;
  color: string;
  isPublic: boolean;
}

export interface LibraryEntryDetailItem extends LibraryEntryListItem {
  publisher: string | null;
  rating: number | null;
  comment: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export type LibraryEntryNotePatch = Partial<
  Pick<
    LibraryEntryDetailItem,
    'status' | 'color' | 'isPublic' | 'rating' | 'comment' | 'note' | 'createdAt' | 'updatedAt'
  >
>;
