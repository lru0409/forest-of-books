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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { SocialRegisterDto } from './dto/social-register.dto';
import { RegisterDto } from './dto/register.dto';
import { CheckNicknameDto } from './dto/check-nickname.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

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

  @Get('check-nickname')
  async checkNickname(@Query() query: CheckNicknameDto) {
    const existingNicknameUser = await this.authService.findUserByNickname(query.nickname);
    return { available: !existingNicknameUser };
  }

  @Post('social/register')
  async socialRegister(@Body() body: SocialRegisterDto, @Req() req: Request, @Res() res: Response) {
    const socialPendingToken = req.cookies['social_pending_token'];
    if (!socialPendingToken) throw new UnauthorizedException();
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
