import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-kakao';

@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
  constructor() {
    super({
      clientID: process.env.API_KAKAO_CLIENT_ID ?? '',
      clientSecret: process.env.API_KAKAO_CLIENT_SECRET ?? '',
      callbackURL: process.env.API_KAKAO_CALLBACK_URL ?? '',
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: (error: unknown, user?: unknown) => void,
  ): Promise<void> {
    done(null, { kakaoId: String(profile.id) });
  }
}
