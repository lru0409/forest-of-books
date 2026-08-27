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
