import { Genre, User } from '@repo/db';

export class MeResponseDto implements Omit<User, 'password'> {
  id!: string;
  email!: string | null;
  nickname!: string;
  bio!: string;
  profileImage!: string;
  naverId!: string | null;
  kakaoId!: string | null;
  googleId!: string | null;
  preferredGenres!: Genre[];
  createdAt!: Date;
  updatedAt!: Date;
}
