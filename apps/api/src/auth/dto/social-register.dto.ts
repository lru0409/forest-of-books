import { IsString, IsArray, IsEnum, MinLength, MaxLength, Matches } from 'class-validator';

import { Genre } from '@repo/db';
import { IsProfileImageUrl } from '../validators/is-profile-image-url.decorator';

export class SocialRegisterDto {
  @IsString()
  @MinLength(2)
  @MaxLength(12)
  @Matches(/^[가-힣a-zA-Z0-9]{2,12}$/, {
    message: '닉네임은 2~12자의 한글, 영문, 숫자만 입력해 주세요.',
  })
  nickname!: string;

  @IsString()
  @MaxLength(160)
  bio!: string;

  @IsProfileImageUrl()
  profileImageUrl!: string;

  @IsArray()
  @IsEnum(Genre, { each: true })
  preferredGenres!: Genre[];
}
