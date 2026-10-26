import { IsString } from 'class-validator';

import { IsValidPassword } from 'src/auth/validators/is-valid-password.decorator';

export class ChangePasswordDto {
  @IsString()
  currentPassword!: string;

  @IsValidPassword()
  newPassword!: string;
}
