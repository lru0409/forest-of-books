export interface FollowUser {
  id: string;
  nickname: string;
  bio: string;
  profileImage: string;
  isFollowing: boolean;
}

export interface FollowList {
  items: FollowUser[];
  nextCursor: string | null;
}
