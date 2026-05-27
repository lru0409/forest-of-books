import { Controller, Get, Req, Res, UseGuards, Post, Body } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { CompleteSignupDto } from './dto/complete-signup.dto';

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
      const pendingToken = this.authService.issuePendingToken(profile);
      res.redirect(`${frontendUrl}/signup?step=2&pending_token=${pendingToken}`);
    }
  }

  @Post('social/register')
  async socialRegister(@Body() body: CompleteSignupDto, @Res() res: Response) {
    const token = await this.authService.socialRegister(body.pendingToken, body);
    return res.json({ token });
  }

  @Post('register')
  async register() {
    // TODO: 일반 회원가입
  }
}
