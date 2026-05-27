import { IsString, IsOptional, IsArray } from 'class-validator';

export class CompleteSignupDto {
  @IsString()
  pendingToken!: string;

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
