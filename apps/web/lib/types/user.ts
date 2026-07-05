import type { Genre } from './genre';

export interface User {
  id: string;
  email: string | null;
  nickname: string;
  bio: string;
  profileImage: string;
  naverId: string | null;
  kakaoId: string | null;
  googleId: string | null;
  preferredGenres: Genre[];
  createdAt: string;
  updatedAt: string;
}
