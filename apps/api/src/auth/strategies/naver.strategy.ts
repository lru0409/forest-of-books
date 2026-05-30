import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-naver-v2';
import { AuthService } from '../auth.service';

@Injectable()
export class NaverStrategy extends PassportStrategy(Strategy, 'naver') {
  constructor(private authService: AuthService) {
    super({
      clientID: process.env.API_NAVER_CLIENT_ID,
      clientSecret: process.env.API_NAVER_CLIENT_SECRET,
      callbackURL: process.env.API_NAVER_CALLBACK_URL,
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: (error: unknown, user?: unknown) => void,
  ): Promise<void> {
    done(null, {
      naverId: profile.id,
      email: profile.email ?? undefined,
      nickname: profile.nickname ?? undefined,
      profileImage: profile.profileImage ?? undefined,
    });
  }
}
