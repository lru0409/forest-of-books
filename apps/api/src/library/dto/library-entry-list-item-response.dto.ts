import { Genre, ReadingStatus } from '@repo/db';

export class LibraryEntryListItemResponseDto {
  id!: string;
  title!: string;
  author!: string;
  genre!: Genre;
  coverUrl!: string | null;
  status!: ReadingStatus;
  color!: string;
  isPublic!: boolean;
}
