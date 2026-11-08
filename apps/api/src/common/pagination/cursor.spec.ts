import { BadRequestException } from '@nestjs/common';

import { LATEST_SORT, POPULAR_SORT } from './cursor';

describe('cursor', () => {
  const createdAt = new Date('2026-01-02T03:04:05.678Z');
  const id = 'entry-1';
  const iso = createdAt.toISOString();
  const toCursor = (payload: string) => Buffer.from(payload).toString('base64url');

  describe('LATEST_SORT', () => {
    it('orderBy는 createdAt desc, id desc', () => {
      expect(LATEST_SORT.orderBy).toEqual([{ createdAt: 'desc' }, { id: 'desc' }]);
    });

    it('cursor 형식은 base64url("<createdAt ISO>|<id>")', () => {
      expect(LATEST_SORT.encode({ createdAt, id })).toBe(toCursor(`${iso}|${id}`));
    });

    it('round-trips createdAt and id', () => {
      const decoded = LATEST_SORT.decode(LATEST_SORT.encode({ createdAt, id }));

      expect(decoded).toEqual({ createdAt, id });
    });

    it.each([
      ['not base64 payload', 'not-a-cursor'],
      ['missing id', toCursor(iso)],
      ['empty id', toCursor(`${iso}|`)],
      ['invalid date', toCursor('nope|entry-1')],
      ['non ISO date', toCursor('2026-01-02|entry-1')],
      ['extra separator', toCursor(`${iso}|entry-1|extra`)],
      ['popular cursor format', POPULAR_SORT.encode({ likeCount: 1, createdAt, id })],
    ])('throws BadRequestException for %s', (_name, cursor) => {
      expect(() => LATEST_SORT.decode(cursor)).toThrow(BadRequestException);
    });

    describe('where', () => {
      it('returns empty condition without cursor', () => {
        expect(LATEST_SORT.where()).toEqual({});
      });

      it('returns keyset condition for createdAt desc, id desc ordering', () => {
        expect(LATEST_SORT.where(LATEST_SORT.encode({ createdAt, id }))).toEqual({
          OR: [{ createdAt: { lt: createdAt } }, { createdAt, id: { lt: id } }],
        });
      });

      it('throws BadRequestException for invalid cursor', () => {
        expect(() => LATEST_SORT.where('bad-cursor')).toThrow(BadRequestException);
      });
    });
  });

  describe('POPULAR_SORT', () => {
    it('orderBy는 likeCount desc, createdAt desc, id desc', () => {
      expect(POPULAR_SORT.orderBy).toEqual([
        { likeCount: 'desc' },
        { createdAt: 'desc' },
        { id: 'desc' },
      ]);
    });

    it('cursor 형식은 base64url("<likeCount>|<createdAt ISO>|<id>")', () => {
      expect(POPULAR_SORT.encode({ likeCount: 7, createdAt, id })).toBe(toCursor(`7|${iso}|${id}`));
    });

    it('round-trips likeCount, createdAt and id', () => {
      const decoded = POPULAR_SORT.decode(POPULAR_SORT.encode({ likeCount: 7, createdAt, id }));

      expect(decoded).toEqual({ likeCount: 7, createdAt, id });
    });

    it.each([
      ['not base64 payload', 'not-a-cursor'],
      ['missing id', toCursor(`3|${iso}`)],
      ['negative likeCount', toCursor(`-1|${iso}|e`)],
      ['non numeric likeCount', toCursor(`x|${iso}|e`)],
      ['decimal likeCount', toCursor(`1.5|${iso}|e`)],
      ['invalid date', toCursor('3|nope|entry-1')],
      ['extra separator', toCursor(`3|${iso}|entry-1|extra`)],
      ['latest cursor format', LATEST_SORT.encode({ createdAt, id })],
    ])('throws BadRequestException for %s', (_name, cursor) => {
      expect(() => POPULAR_SORT.decode(cursor)).toThrow(BadRequestException);
    });

    describe('where', () => {
      it('returns empty condition without cursor', () => {
        expect(POPULAR_SORT.where()).toEqual({});
      });

      it('returns keyset condition for likeCount desc, createdAt desc, id desc ordering', () => {
        expect(POPULAR_SORT.where(POPULAR_SORT.encode({ likeCount: 7, createdAt, id }))).toEqual({
          OR: [
            { likeCount: { lt: 7 } },
            { likeCount: 7, createdAt: { lt: createdAt } },
            { likeCount: 7, createdAt, id: { lt: id } },
          ],
        });
      });
    });
  });
});
