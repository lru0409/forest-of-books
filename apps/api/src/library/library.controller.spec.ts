import { Test, TestingModule } from '@nestjs/testing';
import type { Request } from 'express';

import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

import { LibraryController, LibraryEntryController } from './library.controller';
import { LibraryService } from './library.service';

const mockJwtAuthGuard = { canActivate: () => true };

type MockLibraryService = {
  findByUser: jest.Mock;
  findOne: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  remove: jest.Mock;
};

const createMockLibraryService = (): MockLibraryService => ({
  findByUser: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
});

const requestWithUser = (userId?: string): Request =>
  ({ user: userId ? { id: userId } : undefined }) as unknown as Request;

describe('LibraryController', () => {
  let controller: LibraryController;
  let mockLibraryService: MockLibraryService;

  beforeEach(async () => {
    mockLibraryService = createMockLibraryService();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LibraryController],
      providers: [{ provide: LibraryService, useValue: mockLibraryService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    controller = module.get<LibraryController>(LibraryController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByUser', () => {
    it('로그인 상태면 viewerId를 함께 전달', async () => {
      mockLibraryService.findByUser.mockResolvedValue([]);

      await controller.findByUser('user-1', requestWithUser('user-1'));

      expect(mockLibraryService.findByUser).toHaveBeenCalledWith('user-1', 'user-1');
    });

    it('비로그인이면 viewerId 없이 전달', async () => {
      mockLibraryService.findByUser.mockResolvedValue([]);

      await controller.findByUser('user-1', requestWithUser());

      expect(mockLibraryService.findByUser).toHaveBeenCalledWith('user-1', undefined);
    });
  });
});

describe('LibraryEntryController', () => {
  let controller: LibraryEntryController;
  let mockLibraryService: MockLibraryService;

  beforeEach(async () => {
    mockLibraryService = createMockLibraryService();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LibraryEntryController],
      providers: [{ provide: LibraryService, useValue: mockLibraryService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    controller = module.get<LibraryEntryController>(LibraryEntryController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('요청 유저 id로 service.create 호출', async () => {
      const dto = { book: { title: '토지', author: '박경리', genre: 'NOVEL' as const } };
      mockLibraryService.create.mockResolvedValue({});

      await controller.create(requestWithUser('user-1'), dto);

      expect(mockLibraryService.create).toHaveBeenCalledWith('user-1', dto);
    });
  });

  describe('findOne', () => {
    it('로그인 상태면 viewerId를 함께 전달', async () => {
      mockLibraryService.findOne.mockResolvedValue({});

      await controller.findOne('entry-1', requestWithUser('user-1'));

      expect(mockLibraryService.findOne).toHaveBeenCalledWith('entry-1', 'user-1');
    });

    it('비로그인이면 viewerId 없이 전달', async () => {
      mockLibraryService.findOne.mockResolvedValue({});

      await controller.findOne('entry-1', requestWithUser());

      expect(mockLibraryService.findOne).toHaveBeenCalledWith('entry-1', undefined);
    });
  });

  describe('update', () => {
    it('요청 유저 id와 dto로 service.update 호출', async () => {
      const dto = { isPublic: false };
      mockLibraryService.update.mockResolvedValue({});

      await controller.update('entry-1', requestWithUser('user-1'), dto);

      expect(mockLibraryService.update).toHaveBeenCalledWith('entry-1', 'user-1', dto);
    });
  });

  describe('remove', () => {
    it('요청 유저 id로 service.remove 호출', async () => {
      mockLibraryService.remove.mockResolvedValue(undefined);

      await controller.remove('entry-1', requestWithUser('user-1'));

      expect(mockLibraryService.remove).toHaveBeenCalledWith('entry-1', 'user-1');
    });
  });
});
