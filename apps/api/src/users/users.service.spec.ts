import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import type { User } from '@repo/db';
import { FollowService } from 'src/follow/follow.service';
import { PrismaService } from 'src/prisma/prisma.service';

import { UsersService } from './users.service';

type MockPrismaService = {
  user: {
    findUnique: jest.Mock;
    update: jest.Mock;
  };
};

type MockFollowService = {
  getCounts: jest.Mock;
  isFollowing: jest.Mock;
};

const createMockPrisma = (): MockPrismaService => ({
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
});

const createMockFollowService = (): MockFollowService => ({
  getCounts: jest.fn().mockResolvedValue({ followerCount: 0, followingCount: 0 }),
  isFollowing: jest.fn().mockResolvedValue(false),
});

const user: User = {
  id: 'user-1',
  email: 'user@example.com',
  password: 'hashed',
  nickname: 'tester',
  bio: '안녕하세요',
  profileImage: 'https://image.example.com/profile.png',
  naverId: null,
  kakaoId: null,
  googleId: null,
  preferredGenres: ['NOVEL'],
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-02'),
};

describe('UsersService', () => {
  let service: UsersService;
  let mockPrisma: MockPrismaService;
  let mockFollowService: MockFollowService;

  beforeEach(async () => {
    mockPrisma = createMockPrisma();
    mockFollowService = createMockFollowService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: FollowService, useValue: mockFollowService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─────────────────────────────────────────────
  // getMe
  // ─────────────────────────────────────────────
  describe('getMe', () => {
    it('password를 제외하고 팔로우 카운트와 함께 반환', async () => {
      mockFollowService.getCounts.mockResolvedValue({ followerCount: 2, followingCount: 4 });

      const result = await service.getMe(user);

      expect(result).toEqual({
        id: 'user-1',
        email: 'user@example.com',
        nickname: 'tester',
        bio: '안녕하세요',
        profileImage: user.profileImage,
        naverId: null,
        kakaoId: null,
        googleId: null,
        preferredGenres: ['NOVEL'],
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        followerCount: 2,
        followingCount: 4,
      });
      expect(mockFollowService.getCounts).toHaveBeenCalledWith('user-1');
    });
  });

  // ─────────────────────────────────────────────
  // findProfileById
  // ─────────────────────────────────────────────
  describe('findProfileById', () => {
    it('유저가 없으면 NotFoundException', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findProfileById('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('공개 프로필 필드와 팔로우 정보를 매핑해서 반환', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockFollowService.getCounts.mockResolvedValue({ followerCount: 3, followingCount: 5 });
      mockFollowService.isFollowing.mockResolvedValue(true);

      const result = await service.findProfileById('user-1', 'viewer-1');

      expect(result).toEqual({
        id: 'user-1',
        nickname: 'tester',
        bio: '안녕하세요',
        profileImage: user.profileImage,
        preferredGenres: ['NOVEL'],
        createdAt: user.createdAt,
        followerCount: 3,
        followingCount: 5,
        isFollowing: true,
      });
      expect(mockFollowService.isFollowing).toHaveBeenCalledWith('viewer-1', 'user-1');
    });

    it('viewer가 없으면 isFollowing 조회 없이 false 반환', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(user);

      const result = await service.findProfileById('user-1');

      expect(result.isFollowing).toBe(false);
      expect(mockFollowService.isFollowing).not.toHaveBeenCalled();
    });

    it('본인 프로필이면 isFollowing 조회 없이 false 반환', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(user);

      const result = await service.findProfileById('user-1', 'user-1');

      expect(result.isFollowing).toBe(false);
      expect(mockFollowService.isFollowing).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────
  // updateMyProfile
  // ─────────────────────────────────────────────
  describe('updateMyProfile', () => {
    it('닉네임을 변경하지 않으면 중복 체크 없이 update', async () => {
      mockPrisma.user.update.mockResolvedValue(user);

      await service.updateMyProfile('user-1', { bio: '새 소개' });

      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { bio: '새 소개' },
      });
    });

    it('다른 유저가 이미 쓰는 닉네임이면 ConflictException', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...user, id: 'user-2' });

      await expect(
        service.updateMyProfile('user-1', { nickname: 'taken' }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('본인의 기존 닉네임과 동일하면 통과', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.user.update.mockResolvedValue(user);

      await service.updateMyProfile('user-1', { nickname: 'tester' });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { nickname: 'tester' },
      });
    });

    it('넘긴 필드만 골라서 update', async () => {
      mockPrisma.user.update.mockResolvedValue(user);

      await service.updateMyProfile('user-1', {
        bio: '새 소개',
        preferredGenres: ['ESSAY'],
      });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { bio: '새 소개', preferredGenres: ['ESSAY'] },
      });
    });
  });
});
