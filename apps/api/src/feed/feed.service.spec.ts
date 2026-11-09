import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import type { User } from '@repo/db';
import { LATEST_SORT, POPULAR_SORT } from 'src/common/pagination/cursor';
import { PrismaService } from 'src/prisma/prisma.service';

import { FeedItemsService, FeedEntry, feedEntryInclude } from './feed-items.service';
import { FeedService } from './feed.service';

type MockPrismaService = {
  libraryEntry: { findMany: jest.Mock };
  follow: { findFirst: jest.Mock };
};

type MockFeedItemsService = { toFeedItems: jest.Mock };

const NOW = new Date('2026-02-01T00:00:00.000Z');
const THIRTY_DAYS_AGO = new Date('2026-01-02T00:00:00.000Z');

const makeViewer = (overrides: Partial<User> = {}): User =>
  ({ id: 'viewer-1', preferredGenres: [], ...overrides }) as User;

const makeRow = (id: string, createdAt: Date, likeCount = 0): FeedEntry =>
  ({ id, createdAt, likeCount }) as FeedEntry;

const LATEST_ORDER_BY = [{ createdAt: 'desc' }, { id: 'desc' }];
const POPULAR_ORDER_BY = [{ likeCount: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }];

describe('FeedService', () => {
  let service: FeedService;
  let mockPrisma: MockPrismaService;
  let mockFeedItems: MockFeedItemsService;

  beforeEach(async () => {
    jest.useFakeTimers().setSystemTime(NOW);
    mockPrisma = {
      libraryEntry: { findMany: jest.fn().mockResolvedValue([]) },
      follow: { findFirst: jest.fn() },
    };
    mockFeedItems = { toFeedItems: jest.fn().mockImplementation((rows: FeedEntry[]) => rows) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: FeedItemsService, useValue: mockFeedItems },
      ],
    }).compile();

    service = module.get<FeedService>(FeedService);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('latest', () => {
    it('공개 노트를 최신순으로 limit+1개 조회', async () => {
      await service.getFeed(undefined, 'latest', undefined, 10);

      expect(mockPrisma.libraryEntry.findMany).toHaveBeenCalledWith({
        where: { AND: [{ isPublic: true }, {}] },
        orderBy: LATEST_ORDER_BY,
        take: 11,
        include: feedEntryInclude,
      });
    });

    it('cursor가 있으면 keyset 조건을 추가', async () => {
      const createdAt = new Date('2026-01-10T00:00:00.000Z');

      await service.getFeed(undefined, 'latest', LATEST_SORT.encode({ createdAt, id: 'e-9' }), 10);

      expect(mockPrisma.libraryEntry.findMany).toHaveBeenCalledWith({
        where: {
          AND: [
            { isPublic: true },
            { OR: [{ createdAt: { lt: createdAt } }, { createdAt, id: { lt: 'e-9' } }] },
          ],
        },
        orderBy: LATEST_ORDER_BY,
        take: 11,
        include: feedEntryInclude,
      });
    });

    it('limit+1개가 조회되면 limit개만 반환하고 마지막 항목으로 nextCursor 생성', async () => {
      const rows = [
        makeRow('e-3', new Date('2026-01-03T00:00:00.000Z')),
        makeRow('e-2', new Date('2026-01-02T00:00:00.000Z')),
        makeRow('e-1', new Date('2026-01-01T00:00:00.000Z')),
      ];
      mockPrisma.libraryEntry.findMany.mockResolvedValue(rows);

      const result = await service.getFeed(makeViewer(), 'latest', undefined, 2);

      expect(mockFeedItems.toFeedItems).toHaveBeenCalledWith(rows.slice(0, 2), 'viewer-1');
      expect(result).toEqual({
        items: rows.slice(0, 2),
        nextCursor: LATEST_SORT.encode({ createdAt: rows[1]!.createdAt, id: 'e-2' }),
      });
    });

    it('limit 이하로 조회되면 nextCursor는 null', async () => {
      mockPrisma.libraryEntry.findMany.mockResolvedValue([
        makeRow('e-1', new Date('2026-01-01T00:00:00.000Z')),
      ]);

      const result = await service.getFeed(undefined, 'latest', undefined, 2);

      expect(result.nextCursor).toBeNull();
    });

    it('cursor 형식이 잘못되면 BadRequestException', async () => {
      await expect(service.getFeed(undefined, 'latest', 'bad-cursor', 10)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(mockPrisma.libraryEntry.findMany).not.toHaveBeenCalled();
    });

    it('popular 커서를 넘기면 BadRequestException', async () => {
      const cursor = POPULAR_SORT.encode({ likeCount: 1, createdAt: NOW, id: 'e-1' });

      await expect(service.getFeed(undefined, 'latest', cursor, 10)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('popular', () => {
    it('최근 30일 공개 노트를 좋아요순으로 조회', async () => {
      await service.getFeed(undefined, 'popular', undefined, 10);

      expect(mockPrisma.libraryEntry.findMany).toHaveBeenCalledWith({
        where: { AND: [{ isPublic: true, createdAt: { gte: THIRTY_DAYS_AGO } }, {}] },
        orderBy: POPULAR_ORDER_BY,
        take: 11,
        include: feedEntryInclude,
      });
    });

    it('cursor가 있으면 복합 keyset 조건을 추가', async () => {
      const createdAt = new Date('2026-01-10T00:00:00.000Z');

      await service.getFeed(
        undefined,
        'popular',
        POPULAR_SORT.encode({ likeCount: 5, createdAt, id: 'e-9' }),
        10,
      );

      expect(mockPrisma.libraryEntry.findMany).toHaveBeenCalledWith({
        where: {
          AND: [
            { isPublic: true, createdAt: { gte: THIRTY_DAYS_AGO } },
            {
              OR: [
                { likeCount: { lt: 5 } },
                { likeCount: 5, createdAt: { lt: createdAt } },
                { likeCount: 5, createdAt, id: { lt: 'e-9' } },
              ],
            },
          ],
        },
        orderBy: POPULAR_ORDER_BY,
        take: 11,
        include: feedEntryInclude,
      });
    });

    it('nextCursor에 likeCount를 포함', async () => {
      const rows = [
        makeRow('e-2', new Date('2026-01-03T00:00:00.000Z'), 5),
        makeRow('e-1', new Date('2026-01-02T00:00:00.000Z'), 4),
      ];
      mockPrisma.libraryEntry.findMany.mockResolvedValue(rows);

      const result = await service.getFeed(undefined, 'popular', undefined, 1);

      expect(result.nextCursor).toBe(
        POPULAR_SORT.encode({ likeCount: 5, createdAt: rows[0]!.createdAt, id: 'e-2' }),
      );
    });

    it('latest 커서를 넘기면 BadRequestException', async () => {
      const cursor = LATEST_SORT.encode({ createdAt: NOW, id: 'e-1' });

      await expect(service.getFeed(undefined, 'popular', cursor, 10)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('following', () => {
    it('비로그인이면 UnauthorizedException', async () => {
      await expect(service.getFeed(undefined, 'following', undefined, 10)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(mockPrisma.libraryEntry.findMany).not.toHaveBeenCalled();
    });

    it('팔로우한 유저의 공개 노트를 최신순으로 조회', async () => {
      await service.getFeed(makeViewer(), 'following', undefined, 10);

      expect(mockPrisma.libraryEntry.findMany).toHaveBeenCalledWith({
        where: {
          AND: [{ isPublic: true, user: { followers: { some: { followerId: 'viewer-1' } } } }, {}],
        },
        orderBy: LATEST_ORDER_BY,
        take: 11,
        include: feedEntryInclude,
      });
    });
  });

  describe('recommended', () => {
    it('비로그인이면 최신 탭과 동일하게 조회', async () => {
      await service.getFeed(undefined, 'recommended', undefined, 10);

      expect(mockPrisma.libraryEntry.findMany).toHaveBeenCalledWith({
        where: { AND: [{ isPublic: true }, {}] },
        orderBy: LATEST_ORDER_BY,
        take: 11,
        include: feedEntryInclude,
      });
      expect(mockPrisma.follow.findFirst).not.toHaveBeenCalled();
    });

    it('선호 장르도 팔로잉도 없으면 최신 탭과 동일하게 조회', async () => {
      mockPrisma.follow.findFirst.mockResolvedValue(null);

      await service.getFeed(makeViewer(), 'recommended', undefined, 10);

      expect(mockPrisma.follow.findFirst).toHaveBeenCalledWith({
        where: { followerId: 'viewer-1' },
        select: { id: true },
      });
      expect(mockPrisma.libraryEntry.findMany).toHaveBeenCalledWith({
        where: { AND: [{ isPublic: true }, {}] },
        orderBy: LATEST_ORDER_BY,
        take: 11,
        include: feedEntryInclude,
      });
    });

    it('선호 장르가 있으면 팔로잉 조회 없이 장르 또는 팔로잉 필터로 내 노트를 제외하고 조회', async () => {
      await service.getFeed(
        makeViewer({ preferredGenres: ['NOVEL', 'ESSAY'] }),
        'recommended',
        undefined,
        10,
      );

      expect(mockPrisma.follow.findFirst).not.toHaveBeenCalled();
      expect(mockPrisma.libraryEntry.findMany).toHaveBeenCalledWith({
        where: {
          AND: [
            {
              isPublic: true,
              userId: { not: 'viewer-1' },
              OR: [
                { book: { genre: { in: ['NOVEL', 'ESSAY'] } } },
                { user: { followers: { some: { followerId: 'viewer-1' } } } },
              ],
            },
            {},
          ],
        },
        orderBy: LATEST_ORDER_BY,
        take: 11,
        include: feedEntryInclude,
      });
    });

    it('선호 장르는 없지만 팔로잉이 있으면 추천 필터로 조회', async () => {
      mockPrisma.follow.findFirst.mockResolvedValue({ id: 'follow-1' });

      await service.getFeed(makeViewer(), 'recommended', undefined, 10);

      expect(mockPrisma.libraryEntry.findMany).toHaveBeenCalledWith({
        where: {
          AND: [
            {
              isPublic: true,
              userId: { not: 'viewer-1' },
              OR: [
                { book: { genre: { in: [] } } },
                { user: { followers: { some: { followerId: 'viewer-1' } } } },
              ],
            },
            {},
          ],
        },
        orderBy: LATEST_ORDER_BY,
        take: 11,
        include: feedEntryInclude,
      });
    });
  });
});
