import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-naver-v2';

@Injectable()
export class NaverStrategy extends PassportStrategy(Strategy, 'naver') {
  constructor() {
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
    done(null, { naverId: profile.id });
  }
}
