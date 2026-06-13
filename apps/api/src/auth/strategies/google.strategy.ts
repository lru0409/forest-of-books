import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: process.env.API_GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.API_GOOGLE_CLIENT_SECRET ?? '',
      callbackURL: process.env.API_GOOGLE_CALLBACK_URL ?? '',
      scope: ['profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: (error: unknown, user?: unknown) => void,
  ): Promise<void> {
    done(null, { googleId: profile.id });
  }
}
