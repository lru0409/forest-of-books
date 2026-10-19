import { GUEST_ONLY_ROUTES } from './constants/auth';
import { matchRoute } from './utils';

const STORAGE_KEY = 'postLoginRedirect';

function isSafePath(path: string) {
  const url = new URL(path, window.location.origin);
  if (url.origin !== window.location.origin) return false;
  return !GUEST_ONLY_ROUTES.some((route) => matchRoute(url.pathname, route.path));
}

export function savePostLoginRedirect(path?: string) {
  const target = path ?? `${window.location.pathname}${window.location.search}`;
  if (!isSafePath(target)) return;
  try {
    sessionStorage.setItem(STORAGE_KEY, target);
  } catch {
    // sessionStorage 사용 불가 시 복귀 없이 기본 경로로 이동
  }
}

export function consumePostLoginRedirect(fallback = '/') {
  try {
    const path = sessionStorage.getItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    return path && isSafePath(path) ? path : fallback;
  } catch {
    return fallback;
  }
}
