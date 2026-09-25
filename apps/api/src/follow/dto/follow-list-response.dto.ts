export class FollowUserResponseDto {
  id!: string;
  nickname!: string;
  bio!: string;
  profileImage!: string;
  isFollowing!: boolean;
}

export class FollowListResponseDto {
  items!: FollowUserResponseDto[];
  nextCursor!: string | null;
}
