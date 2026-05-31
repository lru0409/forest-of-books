import { IsString, IsOptional, IsArray, IsEnum } from 'class-validator';

import { Genre } from '@repo/db';

export class SocialRegisterDto {
  @IsString()
  nickname!: string;

  @IsString()
  bio!: string;

  @IsOptional()
  @IsString()
  profileImageUrl?: string;

  @IsArray()
  @IsEnum(Genre, { each: true })
  preferredGenres!: Genre[];
}
