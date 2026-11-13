import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';

import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';

const mockJwtAuthGuard = { canActivate: () => true };

type MockPostsService = {
  findOne: jest.Mock;
  like: jest.Mock;
  unlike: jest.Mock;
  bookmark: jest.Mock;
  unbookmark: jest.Mock;
  recordView: jest.Mock;
};

const requestWithUser = (userId?: string, ip = '1.2.3.4'): Request =>
  ({ user: userId ? { id: userId } : undefined, ip }) as unknown as Request;

describe('PostsController', () => {
  let controller: PostsController;
  let mockPostsService: MockPostsService;

  beforeEach(async () => {
    mockPostsService = {
      findOne: jest.fn(),
      like: jest.fn(),
      unlike: jest.fn(),
      bookmark: jest.fn(),
      unbookmark: jest.fn(),
      recordView: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostsController],
      providers: [{ provide: PostsService, useValue: mockPostsService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(ThrottlerGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    controller = module.get<PostsController>(PostsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('entryId와 조회자 id를 서비스에 전달', async () => {
    mockPostsService.findOne.mockResolvedValue({ entryId: 'entry-1' });

    const result = await controller.findOne('entry-1', requestWithUser('user-1'));

    expect(mockPostsService.findOne).toHaveBeenCalledWith('entry-1', 'user-1');
    expect(result).toEqual({ entryId: 'entry-1' });
  });

  it('비로그인이면 viewerId는 undefined', async () => {
    mockPostsService.findOne.mockResolvedValue({ entryId: 'entry-1' });

    await controller.findOne('entry-1', requestWithUser());

    expect(mockPostsService.findOne).toHaveBeenCalledWith('entry-1', undefined);
  });

  it.each([
    ['like', 'like'],
    ['unlike', 'unlike'],
    ['bookmark', 'bookmark'],
    ['unbookmark', 'unbookmark'],
  ] as const)('%s는 entryId와 요청 유저 id를 서비스에 전달', async (method, serviceMethod) => {
    mockPostsService[serviceMethod].mockResolvedValue(undefined);

    await controller[method]('entry-1', requestWithUser('user-1'));

    expect(mockPostsService[serviceMethod]).toHaveBeenCalledWith('entry-1', 'user-1');
  });

  describe('recordView', () => {
    it('조회자 id와 IP를 서비스에 전달', async () => {
      mockPostsService.recordView.mockResolvedValue(undefined);

      await controller.recordView('entry-1', requestWithUser('user-1', '5.6.7.8'));

      expect(mockPostsService.recordView).toHaveBeenCalledWith('entry-1', 'user-1', '5.6.7.8');
    });

    it('비로그인이면 viewerId는 undefined', async () => {
      mockPostsService.recordView.mockResolvedValue(undefined);

      await controller.recordView('entry-1', requestWithUser());

      expect(mockPostsService.recordView).toHaveBeenCalledWith('entry-1', undefined, '1.2.3.4');
    });
  });
});
