export const LOGIN_REQUIRED_ROUTES: { path: string; redirectTo: string }[] = [
  { path: '/notes/add', redirectTo: '/notes' },
];

export const GUEST_ONLY_ROUTES: { path: string; redirectTo: string }[] = [
  { path: '/signin', redirectTo: '/' },
  { path: '/signup', redirectTo: '/' },
];

export const AUTH_NOTICE_ROUTES: { path: string; description: string }[] = [
  { path: '/notes', description: '로그인하고 나만의 서재를 확인해보세요.' },
  { path: '/profile', description: '로그인하고 내 프로필을 확인해보세요.' },
];
