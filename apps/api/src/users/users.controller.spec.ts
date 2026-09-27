import { Test, TestingModule } from '@nestjs/testing';
import type { Request } from 'express';

import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

import { UsersController } from './users.controller';
import { UsersService } from './users.service';

const mockJwtAuthGuard = { canActivate: () => true };

type MockUsersService = {
  getMe: jest.Mock;
  findProfileById: jest.Mock;
  updateMyProfile: jest.Mock;
};

const createMockUsersService = (): MockUsersService => ({
  getMe: jest.fn(),
  findProfileById: jest.fn(),
  updateMyProfile: jest.fn(),
});

const requestWithUser = (userId?: string): Request =>
  ({ user: userId ? { id: userId } : undefined }) as unknown as Request;

describe('UsersController', () => {
  let controller: UsersController;
  let mockUsersService: MockUsersService;

  beforeEach(async () => {
    mockUsersService = createMockUsersService();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    controller = module.get<UsersController>(UsersController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getMe', () => {
    it('req.user로 service.getMe 호출', async () => {
      mockUsersService.getMe.mockResolvedValue({ id: 'user-1' });

      const result = await controller.getMe(requestWithUser('user-1'));

      expect(mockUsersService.getMe).toHaveBeenCalledWith({ id: 'user-1' });
      expect(result).toEqual({ id: 'user-1' });
    });
  });

  describe('updateMe', () => {
    it('요청 유저 id와 dto로 service.updateMyProfile 호출', async () => {
      const dto = { bio: '새 소개' };
      mockUsersService.updateMyProfile.mockResolvedValue({});

      await controller.updateMe(requestWithUser('user-1'), dto);

      expect(mockUsersService.updateMyProfile).toHaveBeenCalledWith('user-1', dto);
    });
  });

  describe('findOne', () => {
    it('id와 viewer id로 service.findProfileById 호출', async () => {
      mockUsersService.findProfileById.mockResolvedValue({});

      await controller.findOne('user-1', requestWithUser('viewer-1'));

      expect(mockUsersService.findProfileById).toHaveBeenCalledWith('user-1', 'viewer-1');
    });

    it('로그인하지 않은 요청이면 viewer id 없이 호출', async () => {
      mockUsersService.findProfileById.mockResolvedValue({});

      await controller.findOne('user-1', requestWithUser());

      expect(mockUsersService.findProfileById).toHaveBeenCalledWith('user-1', undefined);
    });
  });
});
