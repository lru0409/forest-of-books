import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';

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
  naverCallback(@Req() req: Request, @Res() res: Response) {
    const user = req.user as { id: string };
    const token = this.authService.issueToken(user.id);
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  }
}
