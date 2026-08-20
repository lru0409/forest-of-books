import { LibraryEntryListItemResponseDto } from './library-entry-list-item-response.dto';

export class LibraryEntryDetailResponseDto extends LibraryEntryListItemResponseDto {
  publisher!: string | null;
  rating!: number | null;
  comment!: string | null;
  note!: string | null;
  createdAt!: Date;
  updatedAt!: Date;
}
