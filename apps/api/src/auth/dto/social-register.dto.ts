import { IsString, IsOptional, IsArray } from 'class-validator';

export class SocialRegisterDto {
  @IsString()
  nickname!: string;

  @IsString()
  bio!: string;

  @IsOptional()
  @IsString()
  profileImageUrl?: string;

  @IsArray()
  @IsString({ each: true })
  genres!: string[];
}
