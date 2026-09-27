import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from 'src/prisma/prisma.service';

import { FollowService } from './follow.service';

type MockPrismaService = {
  user: {
    findUnique: jest.Mock;
  };
  follow: {
    upsert: jest.Mock;
    deleteMany: jest.Mock;
    findUnique: jest.Mock;
    findMany: jest.Mock;
    count: jest.Mock;
  };
};

const createMockPrisma = (): MockPrismaService => ({
  user: {
    findUnique: jest.fn(),
  },
  follow: {
    upsert: jest.fn(),
    deleteMany: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
});

const targetUser = { id: 'user-2', nickname: 'target' };

const followerUser = (id: string) => ({
  id,
  nickname: `user-${id}`,
  bio: '',
  profileImage: '',
});

describe('FollowService', () => {
  let service: FollowService;
  let mockPrisma: MockPrismaService;

  beforeEach(async () => {
    mockPrisma = createMockPrisma();

    const module: TestingModule = await Test.createTestingModule({
      providers: [FollowService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<FollowService>(FollowService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─────────────────────────────────────────────
  // follow
  // ─────────────────────────────────────────────
  describe('follow', () => {
    it('자기 자신을 팔로우하면 BadRequestException', async () => {
      await expect(service.follow('user-1', 'user-1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(mockPrisma.follow.upsert).not.toHaveBeenCalled();
    });

    it('대상 유저가 없으면 NotFoundException', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.follow('user-1', 'user-2')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(mockPrisma.follow.upsert).not.toHaveBeenCalled();
    });

    it('정상 팔로우는 upsert로 멱등 처리', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(targetUser);

      await service.follow('user-1', 'user-2');

      expect(mockPrisma.follow.upsert).toHaveBeenCalledWith({
        where: { followerId_followingId: { followerId: 'user-1', followingId: 'user-2' } },
        update: {},
        create: { followerId: 'user-1', followingId: 'user-2' },
      });
    });
  });

  // ─────────────────────────────────────────────
  // unfollow
  // ─────────────────────────────────────────────
  describe('unfollow', () => {
    it('팔로우 관계 삭제, 없어도 에러 없음', async () => {
      mockPrisma.follow.deleteMany.mockResolvedValue({ count: 0 });

      await service.unfollow('user-1', 'user-2');

      expect(mockPrisma.follow.deleteMany).toHaveBeenCalledWith({
        where: { followerId: 'user-1', followingId: 'user-2' },
      });
    });
  });

  // ─────────────────────────────────────────────
  // isFollowing / getCounts
  // ─────────────────────────────────────────────
  describe('isFollowing', () => {
    it('관계 있으면 true', async () => {
      mockPrisma.follow.findUnique.mockResolvedValue({ id: 'follow-1' });

      await expect(service.isFollowing('user-1', 'user-2')).resolves.toBe(true);
    });

    it('관계 없으면 false', async () => {
      mockPrisma.follow.findUnique.mockResolvedValue(null);

      await expect(service.isFollowing('user-1', 'user-2')).resolves.toBe(false);
    });
  });

  describe('getCounts', () => {
    it('팔로워/팔로잉 수를 각각 count', async () => {
      mockPrisma.follow.count.mockResolvedValueOnce(3).mockResolvedValueOnce(5);

      const result = await service.getCounts('user-1');

      expect(mockPrisma.follow.count).toHaveBeenNthCalledWith(1, {
        where: { followingId: 'user-1' },
      });
      expect(mockPrisma.follow.count).toHaveBeenNthCalledWith(2, {
        where: { followerId: 'user-1' },
      });
      expect(result).toEqual({ followerCount: 3, followingCount: 5 });
    });
  });

  // ─────────────────────────────────────────────
  // getFollowers / getFollowing
  // ─────────────────────────────────────────────
  describe('getFollowers', () => {
    it('limit개 이하면 nextCursor null', async () => {
      mockPrisma.follow.findMany.mockResolvedValueOnce([
        { id: 'f1', follower: followerUser('a') },
      ]);

      const result = await service.getFollowers('user-1', undefined, undefined, 20);

      expect(result.nextCursor).toBeNull();
      expect(result.items).toEqual([
        { id: 'a', nickname: 'user-a', bio: '', profileImage: '', isFollowing: false },
      ]);
    });

    it('limit보다 많으면 마지막 항목의 follow id를 nextCursor로 반환', async () => {
      mockPrisma.follow.findMany.mockResolvedValueOnce([
        { id: 'f1', follower: followerUser('a') },
        { id: 'f2', follower: followerUser('b') },
      ]);

      const result = await service.getFollowers('user-1', undefined, undefined, 1);

      expect(result.items).toHaveLength(1);
      expect(result.nextCursor).toBe('f1');
    });

    it('viewerId가 있으면 각 항목의 isFollowing을 표시', async () => {
      mockPrisma.follow.findMany
        .mockResolvedValueOnce([{ id: 'f1', follower: followerUser('a') }])
        .mockResolvedValueOnce([{ followingId: 'a' }]);

      const result = await service.getFollowers('user-1', 'viewer-1', undefined, 20);

      expect(result.items[0]?.isFollowing).toBe(true);
    });

    it('followingId 기준으로 조회하고 follower를 join', async () => {
      mockPrisma.follow.findMany.mockResolvedValueOnce([]);

      await service.getFollowers('user-1', undefined, undefined, 20);

      expect(mockPrisma.follow.findMany).toHaveBeenCalledWith({
        where: { followingId: 'user-1' },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: 21,
        include: { follower: true },
      });
    });

    it('cursor가 있으면 해당 row 다음부터 조회', async () => {
      mockPrisma.follow.findMany.mockResolvedValueOnce([]);

      await service.getFollowers('user-1', undefined, 'cursor-1', 20);

      expect(mockPrisma.follow.findMany).toHaveBeenCalledWith({
        where: { followingId: 'user-1' },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: 21,
        cursor: { id: 'cursor-1' },
        skip: 1,
        include: { follower: true },
      });
    });
  });

  // ─────────────────────────────────────────────
  // getFollowing
  // ─────────────────────────────────────────────
  describe('getFollowing', () => {
    it('followerId 기준으로 조회하고 following을 join', async () => {
      mockPrisma.follow.findMany.mockResolvedValueOnce([]);

      await service.getFollowing('user-1', undefined, undefined, 20);

      expect(mockPrisma.follow.findMany).toHaveBeenCalledWith({
        where: { followerId: 'user-1' },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: 21,
        include: { following: true },
      });
    });

    it('cursor가 있으면 해당 row 다음부터 조회', async () => {
      mockPrisma.follow.findMany.mockResolvedValueOnce([]);

      await service.getFollowing('user-1', undefined, 'cursor-1', 20);

      expect(mockPrisma.follow.findMany).toHaveBeenCalledWith({
        where: { followerId: 'user-1' },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: 21,
        cursor: { id: 'cursor-1' },
        skip: 1,
        include: { following: true },
      });
    });

    it('목록 항목을 매핑해서 반환', async () => {
      mockPrisma.follow.findMany.mockResolvedValueOnce([
        { id: 'f1', following: followerUser('b') },
      ]);

      const result = await service.getFollowing('user-1', undefined, undefined, 20);

      expect(result.items).toEqual([
        { id: 'b', nickname: 'user-b', bio: '', profileImage: '', isFollowing: false },
      ]);
      expect(result.nextCursor).toBeNull();
    });
  });
});
