import { Genre } from '@repo/db';

export class BookDetailResponseDto {
  id!: string;
  title!: string;
  author!: string;
  genre!: Genre;
  publisher!: string | null;
  coverUrl!: string | null;
  publicNoteCount!: number; // 공개된 노트 수
  averageRating!: number | null; // 공개된 노트의 별점 평균
  readingCount!: number; // '읽는 중'으로 설정한 서재 항목 수 (비공개 포함)
  completedCount!: number; // '다 읽음'으로 설정한 서재 항목 수 (비공개 포함)
  myLibraryEntryId!: string | null; // 조회자 서재에 이 책이 있으면 그 항목 id
}
