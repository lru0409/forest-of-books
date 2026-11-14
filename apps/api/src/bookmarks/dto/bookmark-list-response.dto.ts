import { FeedItemResponseDto } from 'src/feed/dto';

export class BookmarkItemResponseDto {
  bookmarkId!: string;
  entryId!: string;
  createdAt!: Date; // 저장한 시각
  isAvailable!: boolean; // 작성자가 비공개로 전환한 노트는 false이고 post는 null
  post!: FeedItemResponseDto | null;
}

export class BookmarkListResponseDto {
  items!: BookmarkItemResponseDto[];
  nextCursor!: string | null;
}
