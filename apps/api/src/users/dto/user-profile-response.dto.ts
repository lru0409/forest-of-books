import { Genre } from '@repo/db';

export class UserProfileResponseDto {
  id!: string;
  nickname!: string;
  bio!: string;
  profileImage!: string;
  preferredGenres!: Genre[];
  createdAt!: Date;
}
