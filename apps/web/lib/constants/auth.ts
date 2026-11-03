export const LOGIN_REQUIRED_ROUTES: { pattern: string; redirectTo: string }[] = [
  { pattern: '/notes/add', redirectTo: '/notes' },
  { pattern: '/profile/edit', redirectTo: '/profile' },
  { pattern: '/settings', redirectTo: '/' },
  { pattern: '/settings/password', redirectTo: '/' },
  { pattern: '/settings/delete-account', redirectTo: '/' },
];

export const GUEST_ONLY_ROUTES: { pattern: string; redirectTo: string }[] = [
  { pattern: '/signin', redirectTo: '/' },
  { pattern: '/signup', redirectTo: '/' },
  { pattern: '/auth/callback', redirectTo: '/' },
];

export const AUTH_NOTICE_ROUTES: { pattern: string; description: string }[] = [
  { pattern: '/notes', description: '로그인하고 나만의 서재를 확인해보세요.' },
  { pattern: '/profile', description: '로그인하고 내 프로필을 확인해보세요.' },
];
