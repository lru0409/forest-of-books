import { Genre } from '@repo/db';

export class FeedItemUserDto {
  id!: string;
  nickname!: string;
  profileImage!: string;
  isFollowing!: boolean;
}

export class FeedItemBookDto {
  id!: string;
  title!: string;
  author!: string;
  coverUrl!: string | null;
  genre!: Genre;
}

export class FeedItemResponseDto {
  entryId!: string;
  user!: FeedItemUserDto;
  book!: FeedItemBookDto;
  rating!: number | null;
  comment!: string | null;
  notePreview!: string | null; // 노트 본문 앞부분. 잘렸으면 끝에 '…'가 붙는다.
  createdAt!: Date;
  likeCount!: number;
  viewCount!: number;
  isLiked!: boolean;
  isBookmarked!: boolean;
  myLibraryEntryId!: string | null; // 조회자의 서재에 같은 책이 있으면 그 항목 id
}

export class FeedResponseDto {
  items!: FeedItemResponseDto[];
  nextCursor!: string | null;
}
