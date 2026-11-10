import { Test, TestingModule } from '@nestjs/testing';
import type { Request } from 'express';

import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';

const mockJwtAuthGuard = { canActivate: () => true };

type MockPostsService = { findOne: jest.Mock };

const requestWithUser = (userId?: string): Request =>
  ({ user: userId ? { id: userId } : undefined }) as unknown as Request;

describe('PostsController', () => {
  let controller: PostsController;
  let mockPostsService: MockPostsService;

  beforeEach(async () => {
    mockPostsService = { findOne: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostsController],
      providers: [{ provide: PostsService, useValue: mockPostsService }],
    })
      .overrideGuard(JwtAuthGuard)
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
});
