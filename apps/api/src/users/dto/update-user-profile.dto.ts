import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';

import { Genre } from '@repo/db';

import { IsProfileImageUrl } from 'src/auth/validators/is-profile-image-url.decorator';

export class UpdateUserProfileDto {
  @IsOptional()
  @IsString()
  nickname?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsProfileImageUrl()
  profileImage?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(Genre, { each: true })
  preferredGenres?: Genre[];
}
