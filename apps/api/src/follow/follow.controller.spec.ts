import { Test, TestingModule } from '@nestjs/testing';
import type { Request } from 'express';

import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

import { FollowController, FollowListController } from './follow.controller';
import { FollowService } from './follow.service';

const mockJwtAuthGuard = { canActivate: () => true };

type MockFollowService = {
  follow: jest.Mock;
  unfollow: jest.Mock;
  getFollowers: jest.Mock;
  getFollowing: jest.Mock;
};

const createMockFollowService = (): MockFollowService => ({
  follow: jest.fn(),
  unfollow: jest.fn(),
  getFollowers: jest.fn(),
  getFollowing: jest.fn(),
});

const requestWithUser = (userId?: string): Request =>
  ({ user: userId ? { id: userId } : undefined }) as unknown as Request;

describe('FollowController', () => {
  let controller: FollowController;
  let mockFollowService: MockFollowService;

  beforeEach(async () => {
    mockFollowService = createMockFollowService();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FollowController],
      providers: [{ provide: FollowService, useValue: mockFollowService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    controller = module.get<FollowController>(FollowController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('follow', () => {
    it('요청 유저를 follower로, 파라미터를 followingId로 전달', async () => {
      mockFollowService.follow.mockResolvedValue(undefined);

      await controller.follow('user-2', requestWithUser('user-1'));

      expect(mockFollowService.follow).toHaveBeenCalledWith('user-1', 'user-2');
    });
  });

  describe('unfollow', () => {
    it('요청 유저를 follower로, 파라미터를 followingId로 전달', async () => {
      mockFollowService.unfollow.mockResolvedValue(undefined);

      await controller.unfollow('user-2', requestWithUser('user-1'));

      expect(mockFollowService.unfollow).toHaveBeenCalledWith('user-1', 'user-2');
    });
  });
});

describe('FollowListController', () => {
  let controller: FollowListController;
  let mockFollowService: MockFollowService;

  beforeEach(async () => {
    mockFollowService = createMockFollowService();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FollowListController],
      providers: [{ provide: FollowService, useValue: mockFollowService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    controller = module.get<FollowListController>(FollowListController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getFollowers', () => {
    it('로그인 상태면 viewerId와 쿼리를 함께 전달', async () => {
      mockFollowService.getFollowers.mockResolvedValue({ items: [], nextCursor: null });

      await controller.getFollowers(
        'user-1',
        { cursor: 'cursor-1', limit: 10 },
        requestWithUser('viewer-1'),
      );

      expect(mockFollowService.getFollowers).toHaveBeenCalledWith(
        'user-1',
        'viewer-1',
        'cursor-1',
        10,
      );
    });

    it('비로그인이면 viewerId 없이 전달', async () => {
      mockFollowService.getFollowers.mockResolvedValue({ items: [], nextCursor: null });

      await controller.getFollowers('user-1', {}, requestWithUser());

      expect(mockFollowService.getFollowers).toHaveBeenCalledWith(
        'user-1',
        undefined,
        undefined,
        undefined,
      );
    });
  });

  describe('getFollowing', () => {
    it('로그인 상태면 viewerId와 쿼리를 함께 전달', async () => {
      mockFollowService.getFollowing.mockResolvedValue({ items: [], nextCursor: null });

      await controller.getFollowing(
        'user-1',
        { cursor: 'cursor-1', limit: 10 },
        requestWithUser('viewer-1'),
      );

      expect(mockFollowService.getFollowing).toHaveBeenCalledWith(
        'user-1',
        'viewer-1',
        'cursor-1',
        10,
      );
    });

    it('비로그인이면 viewerId 없이 전달', async () => {
      mockFollowService.getFollowing.mockResolvedValue({ items: [], nextCursor: null });

      await controller.getFollowing('user-1', {}, requestWithUser());

      expect(mockFollowService.getFollowing).toHaveBeenCalledWith(
        'user-1',
        undefined,
        undefined,
        undefined,
      );
    });
  });
});
