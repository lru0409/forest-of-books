import { Test, TestingModule } from '@nestjs/testing';
import type { Request } from 'express';

import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

import { BookmarksController } from './bookmarks.controller';
import { BookmarksService } from './bookmarks.service';

const mockJwtAuthGuard = { canActivate: () => true };

type MockBookmarksService = { findMine: jest.Mock };

describe('BookmarksController', () => {
  let controller: BookmarksController;
  let mockBookmarksService: MockBookmarksService;

  beforeEach(async () => {
    mockBookmarksService = { findMine: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookmarksController],
      providers: [{ provide: BookmarksService, useValue: mockBookmarksService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    controller = module.get<BookmarksController>(BookmarksController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('요청 유저 id와 cursor, limit을 서비스에 전달', async () => {
    mockBookmarksService.findMine.mockResolvedValue({ items: [], nextCursor: null });

    const result = await controller.findMine({ cursor: 'c', limit: 5 }, {
      user: { id: 'user-1' },
    } as unknown as Request);

    expect(mockBookmarksService.findMine).toHaveBeenCalledWith('user-1', 'c', 5);
    expect(result).toEqual({ items: [], nextCursor: null });
  });
});
