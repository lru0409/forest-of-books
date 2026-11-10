import { FeedItemResponseDto } from 'src/feed/dto';

export class PostDetailResponseDto extends FeedItemResponseDto {
  note!: string | null;
}
