import { FeedItemBookDto } from 'src/feed/dto';
import { FollowUserResponseDto } from 'src/follow/dto';

export class CommunityBookResponseDto {
  book!: FeedItemBookDto;
  // 집계 기간 안에 공개된 노트 수와 그 노트들이 받은 좋아요 합계
  noteCount!: number;
  likeCount!: number;
}

export class CommunityUserResponseDto extends FollowUserResponseDto {
  followerCount!: number; // 이 유저를 팔로우하는 사람 수
}
