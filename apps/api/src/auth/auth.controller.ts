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
  SendEmailVerificationCodeDto,
  VerifyEmailCodeDto,
  CheckNicknameDto,
  RegisterDto,
  SocialRegisterDto,
  LoginDto,
  CheckNicknameResponseDto,
  AuthTokenResponseDto,
  MeResponseDto,
} from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { User } from '@repo/db';

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

  @Get('kakao')
  @UseGuards(AuthGuard('kakao'))
  kakaoLogin() {
    // Passport가 카카오 로그인 페이지로 리다이렉트 처리
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin() {
    // Passport가 구글 로그인 페이지로 리다이렉트 처리
  }

  @Get('naver/callback')
  @UseGuards(AuthGuard('naver'))
  async naverCallback(@Req() req: Request, @Res() res: Response) {
    const { naverId } = req.user as { naverId: string };
    return this.handleSocialCallback(res, { naverId }, () =>
      this.authService.findUserByNaverId(naverId),
    );
  }

  @Get('kakao/callback')
  @UseGuards(AuthGuard('kakao'))
  async kakaoCallback(@Req() req: Request, @Res() res: Response) {
    const { kakaoId } = req.user as { kakaoId: string };
    return this.handleSocialCallback(res, { kakaoId }, () =>
      this.authService.findUserByKakaoId(kakaoId),
    );
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const { googleId } = req.user as { googleId: string };
    return this.handleSocialCallback(res, { googleId }, () =>
      this.authService.findUserByGoogleId(googleId),
    );
  }

  private async handleSocialCallback(
    res: Response,
    profile: { naverId?: string; kakaoId?: string; googleId?: string },
    findExistingUser: () => Promise<{ id: string } | null>,
  ) {
    const frontendUrl = process.env.API_FRONTEND_URL ?? 'http://localhost:3000';

    const existingUser = await findExistingUser();
    if (existingUser) {
      const token = this.authService.issueToken(existingUser.id);
      res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
      return;
    }

    const socialPendingToken = this.authService.issueSocialPendingToken(profile);
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
  async checkNickname(@Query() query: CheckNicknameDto): Promise<CheckNicknameResponseDto> {
    const existingNicknameUser = await this.authService.findUserByNickname(query.nickname);
    return { available: !existingNicknameUser };
  }

  @Post('social/register')
  async socialRegister(
    @Body() body: SocialRegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthTokenResponseDto> {
    const socialPendingToken = req.cookies['social_pending_token'];
    if (typeof socialPendingToken !== 'string') throw new UnauthorizedException();
    res.clearCookie('social_pending_token');
    const token = await this.authService.socialRegister(socialPendingToken, body);
    return { token };
  }

  @Post('register')
  async register(@Body() body: RegisterDto): Promise<AuthTokenResponseDto> {
    const token = await this.authService.register(body);
    return { token };
  }

  @Post('login')
  async login(@Body() body: LoginDto): Promise<AuthTokenResponseDto> {
    const token = await this.authService.login(body);
    return { token };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: Request): MeResponseDto {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...user } = req.user as User;
    return user;
  }
}
