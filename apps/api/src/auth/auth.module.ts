import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmailVerificationService } from './email-verification.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { NaverStrategy } from './strategies/naver.strategy';
import { KakaoStrategy } from './strategies/kakao.strategy';
import { GoogleStrategy } from './strategies/google.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret:
        process.env.API_JWT_SECRET ??
        (() => {
          throw new Error('API_JWT_SECRET is not set');
        })(),
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    EmailVerificationService,
    JwtAuthGuard,
    NaverStrategy,
    KakaoStrategy,
    GoogleStrategy,
  ],
  exports: [JwtAuthGuard, JwtModule],
})
export class AuthModule {}
