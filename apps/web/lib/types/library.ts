import type { Genre } from './book';

export type ReadingStatus = 'NOT_STARTED' | 'READING' | 'COMPLETED' | 'ON_HOLD';

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

export interface LibraryEntryDetailItem {
  publisher: string | null;
  rating: number | null;
  comment: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export type LibraryEntryNotePatch = Partial<
  Pick<LibraryEntryListItem, 'status' | 'color' | 'isPublic'> &
    Pick<LibraryEntryDetailItem, 'rating' | 'comment' | 'note' | 'createdAt' | 'updatedAt'>
>;
