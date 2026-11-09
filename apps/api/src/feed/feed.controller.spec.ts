import { Test, TestingModule } from '@nestjs/testing';
import type { Request } from 'express';

import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

import { FeedController } from './feed.controller';
import { FeedService } from './feed.service';

const mockJwtAuthGuard = { canActivate: () => true };

type MockFeedService = { getFeed: jest.Mock };

const requestWithUser = (user?: { id: string }): Request => ({ user }) as unknown as Request;

describe('FeedController', () => {
  let controller: FeedController;
  let mockFeedService: MockFeedService;

  beforeEach(async () => {
    mockFeedService = { getFeed: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FeedController],
      providers: [{ provide: FeedService, useValue: mockFeedService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    controller = module.get<FeedController>(FeedController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('요청 유저와 쿼리를 서비스에 전달', async () => {
    const user = { id: 'user-1' };
    mockFeedService.getFeed.mockResolvedValue({ items: [], nextCursor: null });

    const result = await controller.getFeed(
      { tab: 'popular', cursor: 'c', limit: 5 },
      requestWithUser(user),
    );

    expect(mockFeedService.getFeed).toHaveBeenCalledWith(user, 'popular', 'c', 5);
    expect(result).toEqual({ items: [], nextCursor: null });
  });

  it('tab이 없으면 recommended, 비로그인이면 viewer는 undefined', async () => {
    mockFeedService.getFeed.mockResolvedValue({ items: [], nextCursor: null });

    await controller.getFeed({}, requestWithUser());

    expect(mockFeedService.getFeed).toHaveBeenCalledWith(
      undefined,
      'recommended',
      undefined,
      undefined,
    );
  });
});
