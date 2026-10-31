import { IsOptional, IsString } from 'class-validator';

export class DeleteAccountDto {
  // 비밀번호가 있는 계정은 현재 비밀번호로 확인
  @IsOptional()
  @IsString()
  password?: string;

  // 소셜 계정(비밀번호 없음)은 닉네임 입력으로 확인
  @IsOptional()
  @IsString()
  nickname?: string;
}
