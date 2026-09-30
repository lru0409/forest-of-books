import type { Genre } from './book';

interface UserProfileBase {
  id: string;
  nickname: string;
  bio: string;
  profileImage: string;
  preferredGenres: Genre[];
  createdAt: string;
  followerCount: number;
  followingCount: number;
}

export interface PublicUserProfile extends UserProfileBase {
  isFollowing: boolean;
}

export interface Me extends UserProfileBase {
  email: string | null;
  naverId: string | null;
  kakaoId: string | null;
  googleId: string | null;
  updatedAt: string;
}
