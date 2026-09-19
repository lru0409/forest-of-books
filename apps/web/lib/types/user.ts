import type { Genre } from './book';

export interface PublicUserProfile {
  id: string;
  nickname: string;
  bio: string;
  profileImage: string;
  preferredGenres: Genre[];
  createdAt: string;
}

export interface Me extends PublicUserProfile {
  email: string | null;
  naverId: string | null;
  kakaoId: string | null;
  googleId: string | null;
  updatedAt: string;
}
