import {
  Controller,
  Get,
  Req,
  Res,
  UseGuards,
  Post,
  Body,
  Query,
  UnauthorizedException,
  HttpCode,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { EmailVerificationService } from './email-verification.service';
import {
  CheckNicknameDto,
  RegisterDto,
  SendEmailVerificationCodeDto,
  SocialRegisterDto,
  VerifyEmailCodeDto,
} from './dto';

// TODO: 테스트 작성

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private emailVerificationService: EmailVerificationService,
  ) {}

  @Get('naver')
  @UseGuards(AuthGuard('naver'))
  naverLogin() {
    // Passport가 네이버 로그인 페이지로 리다이렉트 처리
  }

  @Get('naver/callback')
  @UseGuards(AuthGuard('naver'))
  async naverCallback(@Req() req: Request, @Res() res: Response) {
    const profile = req.user as { naverId: string };
    const frontendUrl = process.env.API_FRONTEND_URL ?? 'http://localhost:3000';

    const existingNaverUser = await this.authService.findUserByNaverId(profile.naverId);
    if (existingNaverUser) {
      const token = this.authService.issueToken(existingNaverUser.id);
      res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
      return;
    }

    const socialPendingToken = this.authService.issueSocialPendingToken({
      naverId: profile.naverId,
    });
    res.cookie('social_pending_token', socialPendingToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.redirect(`${frontendUrl}/signup?step=2&social_login=true`);
  }

  @Post('email-verifications')
  @HttpCode(204)
  async sendEmailVerificationCode(@Body() body: SendEmailVerificationCodeDto) {
    await this.emailVerificationService.sendCode(body.email);
    return null;
  }

  @Post('email-verifications/verify')
  @HttpCode(204)
  async verifyEmailCode(@Body() body: VerifyEmailCodeDto) {
    await this.emailVerificationService.verifyCode(body.email, body.code);
    return null;
  }

  @Get('check-nickname')
  async checkNickname(@Query() query: CheckNicknameDto) {
    const existingNicknameUser = await this.authService.findUserByNickname(query.nickname);
    return { available: !existingNicknameUser };
  }

  @Post('social/register')
  async socialRegister(@Body() body: SocialRegisterDto, @Req() req: Request, @Res() res: Response) {
    const socialPendingToken = req.cookies['social_pending_token'];
    if (typeof socialPendingToken !== 'string') throw new UnauthorizedException();
    res.clearCookie('social_pending_token');
    const token = await this.authService.socialRegister(socialPendingToken, body);
    return res.json({ token });
  }

  @Post('register')
  async register(@Body() body: RegisterDto, @Res() res: Response) {
    const token = await this.authService.register(body);
    return res.json({ token });
  }
}
