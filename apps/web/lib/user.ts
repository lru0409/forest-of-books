import type { LoginProvider, Me } from './types/user';

export function getLoginProvider(me: Me): LoginProvider {
  if (me.kakaoId) return 'KAKAO';
  if (me.googleId) return 'GOOGLE';
  if (me.naverId) return 'NAVER';
  return 'EMAIL';
}
