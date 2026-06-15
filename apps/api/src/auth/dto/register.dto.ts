import {
  IsString,
  IsArray,
  IsEnum,
  IsEmail,
  IsUrl,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

import { Genre } from '@repo/db';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(16)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,16}$/, {
    message: '비밀번호는 8~16자의 영문 대소문자, 숫자, 특수문자를 조합해 주세요.',
  })
  password!: string;

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

  @IsUrl()
  profileImageUrl!: string;

  @IsArray()
  @IsEnum(Genre, { each: true })
  preferredGenres!: Genre[];
}
