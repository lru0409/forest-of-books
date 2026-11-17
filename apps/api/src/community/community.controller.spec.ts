import { Test, TestingModule } from '@nestjs/testing';
import type { Request } from 'express';

import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

import { CommunityController } from './community.controller';
import { CommunityService } from './community.service';

const mockJwtAuthGuard = { canActivate: () => true };

type MockCommunityService = { getPopularBooks: jest.Mock; getUsers: jest.Mock };

const requestWithUser = (userId?: string): Request =>
  ({ user: userId ? { id: userId } : undefined }) as unknown as Request;

describe('CommunityController', () => {
  let controller: CommunityController;
  let mockCommunityService: MockCommunityService;

  beforeEach(async () => {
    mockCommunityService = { getPopularBooks: jest.fn(), getUsers: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommunityController],
      providers: [{ provide: CommunityService, useValue: mockCommunityService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    controller = module.get<CommunityController>(CommunityController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('getPopularBooks는 limit을 서비스에 전달', async () => {
    mockCommunityService.getPopularBooks.mockResolvedValue([]);

    await controller.getPopularBooks({ limit: 3 });

    expect(mockCommunityService.getPopularBooks).toHaveBeenCalledWith(3);
  });

  it('getUsers는 조회자 id와 limit을 서비스에 전달', async () => {
    mockCommunityService.getUsers.mockResolvedValue([]);

    await controller.getUsers({ limit: 3 }, requestWithUser('user-1'));

    expect(mockCommunityService.getUsers).toHaveBeenCalledWith('user-1', 3);
  });

  it('getUsers는 비로그인이면 viewerId가 undefined', async () => {
    mockCommunityService.getUsers.mockResolvedValue([]);

    await controller.getUsers({}, requestWithUser());

    expect(mockCommunityService.getUsers).toHaveBeenCalledWith(undefined, undefined);
  });
});
