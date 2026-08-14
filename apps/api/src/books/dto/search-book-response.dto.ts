import { Genre } from '@repo/db';

export class SearchBookItemDto {
  id!: string;
  title!: string;
  author!: string;
  publisher!: string;
  isbn!: string;
  coverUrl!: string;
  genre!: Genre;
}

export class SearchBooksResponseDto {
  total!: number;
  items!: SearchBookItemDto[];
}
