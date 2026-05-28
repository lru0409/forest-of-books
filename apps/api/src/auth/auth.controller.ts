import {
  Controller,
  Get,
  Req,
  Res,
  UseGuards,
  Post,
  Body,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { SocialRegisterDto } from './dto/social-register.dto';

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
    const profile = req.user as {
      naverId: string;
      email?: string;
      nickname?: string;
      profileImage?: string;
    };
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';

    const existing = await this.authService.findNaverUser(profile.naverId);
    if (existing) {
      const token = this.authService.issueToken(existing.id);
      res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
    } else {
      // TODO: pending token 대신 Onboarding user를 관리하거나 서버 저장형 pending session 활용하는 방식 고려
      const socialPendingToken = this.authService.issueSocialPendingToken(profile);
      res.cookie('social_pending_token', socialPendingToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 30 * 60 * 1000, // 30분
      });
      res.redirect(`${frontendUrl}/signup?step=2&social_login=true`);
    }
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
  async register() {
    // TODO: 일반 회원가입
  }
}
