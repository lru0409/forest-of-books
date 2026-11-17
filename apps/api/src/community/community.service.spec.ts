import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from 'src/prisma/prisma.service';

import { CommunityService } from './community.service';

type MockPrismaService = {
  libraryEntry: { groupBy: jest.Mock };
  book: { findMany: jest.Mock };
  user: { findMany: jest.Mock };
  follow: { findMany: jest.Mock };
};

const NOW = new Date('2026-02-01T00:00:00.000Z');
const THIRTY_DAYS_AGO = new Date('2026-01-02T00:00:00.000Z');

const makeBook = (id: string) => ({
  id,
  title: `title-${id}`,
  author: 'author',
  genre: 'NOVEL',
  publisher: null,
  coverUrl: null,
  isbn: null,
  createdAt: NOW,
});

describe('CommunityService', () => {
  let service: CommunityService;
  let mockPrisma: MockPrismaService;

  beforeEach(async () => {
    jest.useFakeTimers().setSystemTime(NOW);
    mockPrisma = {
      libraryEntry: { groupBy: jest.fn().mockResolvedValue([]) },
      book: { findMany: jest.fn().mockResolvedValue([]) },
      user: { findMany: jest.fn().mockResolvedValue([]) },
      follow: { findMany: jest.fn().mockResolvedValue([]) },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [CommunityService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<CommunityService>(CommunityService);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('getPopularBooks', () => {
    it('최근 30일 공개 노트를 좋아요 합계, 노트 수 순으로 책별 집계', async () => {
      await service.getPopularBooks(3);

      expect(mockPrisma.libraryEntry.groupBy).toHaveBeenCalledWith({
        by: ['bookId'],
        where: { isPublic: true, createdAt: { gte: THIRTY_DAYS_AGO } },
        _sum: { likeCount: true },
        _count: { _all: true },
        orderBy: [
          { _sum: { likeCount: 'desc' } },
          { _count: { bookId: 'desc' } },
          { bookId: 'desc' },
        ],
        take: 3,
      });
    });

    it('집계 결과가 없으면 책 조회 없이 빈 배열', async () => {
      const result = await service.getPopularBooks();

      expect(result).toEqual([]);
      expect(mockPrisma.book.findMany).not.toHaveBeenCalled();
    });

    it('집계 순서를 유지하면서 책 정보를 붙임 (limit 기본값 5)', async () => {
      mockPrisma.libraryEntry.groupBy.mockResolvedValue([
        { bookId: 'b-2', _sum: { likeCount: 9 }, _count: { _all: 2 } },
        { bookId: 'b-1', _sum: { likeCount: null }, _count: { _all: 1 } },
      ]);
      mockPrisma.book.findMany.mockResolvedValue([makeBook('b-1'), makeBook('b-2')]);

      const result = await service.getPopularBooks();

      expect(mockPrisma.libraryEntry.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5 }),
      );
      expect(mockPrisma.book.findMany).toHaveBeenCalledWith({
        where: { id: { in: ['b-2', 'b-1'] } },
      });
      expect(result).toEqual([
        {
          book: { id: 'b-2', title: 'title-b-2', author: 'author', coverUrl: null, genre: 'NOVEL' },
          noteCount: 2,
          likeCount: 9,
        },
        {
          book: { id: 'b-1', title: 'title-b-1', author: 'author', coverUrl: null, genre: 'NOVEL' },
          noteCount: 1,
          likeCount: 0,
        },
      ]);
    });
  });

  describe('getUsers', () => {
    const makeUser = (id: string, followers: number) => ({
      id,
      nickname: `nick-${id}`,
      bio: 'bio',
      profileImage: 'img',
      _count: { followers },
    });

    const userQuery = (where: object) => ({
      where,
      orderBy: [{ followers: { _count: 'desc' } }, { createdAt: 'desc' }, { id: 'desc' }],
      take: 5,
      select: {
        id: true,
        nickname: true,
        bio: true,
        profileImage: true,
        _count: { select: { followers: true } },
      },
    });

    it('비로그인이면 공개 노트가 있는 유저를 팔로워 순으로 조회하고 팔로우 조회는 하지 않음', async () => {
      mockPrisma.user.findMany.mockResolvedValue([makeUser('u-1', 4)]);

      const result = await service.getUsers(undefined);

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        userQuery({ libraryEntries: { some: { isPublic: true } } }),
      );
      expect(mockPrisma.follow.findMany).not.toHaveBeenCalled();
      expect(result).toEqual([
        {
          id: 'u-1',
          nickname: 'nick-u-1',
          bio: 'bio',
          profileImage: 'img',
          isFollowing: false,
          followerCount: 4,
        },
      ]);
    });

    it('로그인하면 나를 제외하고 isFollowing을 채움', async () => {
      mockPrisma.user.findMany.mockResolvedValue([makeUser('u-1', 4), makeUser('u-2', 1)]);
      mockPrisma.follow.findMany.mockResolvedValue([{ followingId: 'u-2' }]);

      const result = await service.getUsers('viewer-1');

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        userQuery({
          libraryEntries: { some: { isPublic: true } },
          id: { not: 'viewer-1' },
        }),
      );
      expect(mockPrisma.follow.findMany).toHaveBeenCalledWith({
        where: { followerId: 'viewer-1', followingId: { in: ['u-1', 'u-2'] } },
        select: { followingId: true },
      });
      expect(result.map((user) => user.isFollowing)).toEqual([false, true]);
    });
  });
});
