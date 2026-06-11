import { IsEmail, Matches } from 'class-validator';

export class VerifyEmailCodeDto {
  @IsEmail()
  email!: string;

  @Matches(/^\d{6}$/, {
    message: '인증 코드는 6자리 숫자여야 합니다.',
  })
  code!: string;
}
