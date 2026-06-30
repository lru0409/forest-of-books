import { IsEmail } from 'class-validator';

export class VerifyEmailCodeDto {
  @IsEmail()
  email!: string;

  code!: string;
}
