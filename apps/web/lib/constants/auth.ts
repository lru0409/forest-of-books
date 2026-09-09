export const LOGIN_REQUIRED_ROUTES: { path: string; redirectTo: string }[] = [
  { path: '/notes/add', redirectTo: '/notes' },
];

export const GUEST_ONLY_ROUTES: { path: string; redirectTo: string }[] = [
  { path: '/signin', redirectTo: '/' },
  { path: '/signup', redirectTo: '/' },
];
