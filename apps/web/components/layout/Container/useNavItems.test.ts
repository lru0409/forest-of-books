import { describe, expect, it } from 'vitest';

import { isNavItemActive } from './useNavItems';

describe('isNavItemActive', () => {
  describe('community (/)', () => {
    it.each(['/', '/books/book-1', '/posts/entry-1'])('is active on %s', (pathname) => {
      expect(isNavItemActive(pathname, '/')).toBe(true);
    });

    it.each(['/notes', '/profile', '/books', '/books/', '/posts'])(
      'is not active on %s',
      (pathname) => {
        expect(isNavItemActive(pathname, '/')).toBe(false);
      },
    );
  });

  describe('profile (/profile)', () => {
    it.each(['/profile', '/profile/edit', '/profile/me-id'])(
      'is active on %s for own id',
      (pathname) => {
        expect(isNavItemActive(pathname, '/profile', 'me-id')).toBe(true);
      },
    );

    it("is not active on another user's profile", () => {
      expect(isNavItemActive('/profile/other-id', '/profile', 'me-id')).toBe(false);
    });

    it('does not match a user profile path when logged out', () => {
      expect(isNavItemActive('/profile/other-id', '/profile')).toBe(false);
    });
  });

  describe('other items', () => {
    it('matches by prefix', () => {
      expect(isNavItemActive('/notes/add', '/notes')).toBe(true);
      expect(isNavItemActive('/settings/password', '/settings')).toBe(true);
    });

    it('does not match unrelated paths', () => {
      expect(isNavItemActive('/profile', '/notes')).toBe(false);
    });
  });
});
