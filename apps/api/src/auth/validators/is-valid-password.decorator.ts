import { applyDecorators } from '@nestjs/common';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export function IsValidPassword() {
  return applyDecorators(
    IsString(),
    MinLength(8),
    MaxLength(16),
    Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,16}$/, {
      message: '비밀번호는 8~16자의 영문 대소문자, 숫자, 특수문자를 조합해 주세요.',
    }),
  );
}
