import { Test, TestingModule } from '@nestjs/testing';
import type { Request } from 'express';

import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

import { BooksController } from './books.controller';
import { BooksService } from './books.service';

type MockBooksService = {
  search: jest.Mock;
  findOne: jest.Mock;
  findNotes: jest.Mock;
};

const mockJwtAuthGuard = { canActivate: () => true };

const requestWithUser = (userId?: string): Request =>
  ({ user: userId ? { id: userId } : undefined }) as unknown as Request;

const createMockBooksService = (): MockBooksService => ({
  search: jest.fn(),
  findOne: jest.fn(),
  findNotes: jest.fn(),
});

describe('BooksController', () => {
  let controller: BooksController;
  let mockBooksService: MockBooksService;

  beforeEach(async () => {
    mockBooksService = createMockBooksService();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BooksController],
      providers: [{ provide: BooksService, useValue: mockBooksService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    controller = module.get<BooksController>(BooksController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('search', () => {
    it('query만 있으면 page/limit는 undefined로 service 호출', async () => {
      mockBooksService.search.mockResolvedValue({ total: 0, items: [] });

      await controller.search({ query: '토지' });

      expect(mockBooksService.search).toHaveBeenCalledWith('토지', undefined, undefined);
    });

    it('page/limit을 그대로 service에 전달', async () => {
      mockBooksService.search.mockResolvedValue({ total: 0, items: [] });

      await controller.search({ query: '토지', page: 2, limit: 20 });

      expect(mockBooksService.search).toHaveBeenCalledWith('토지', 2, 20);
    });

    it('service의 반환값을 그대로 반환', async () => {
      const serviceResult = {
        total: 1,
        items: [
          {
            id: '123',
            title: '토지',
            author: '박경리',
            publisher: '나남출판',
            isbn: '9788930057000',
            coverUrl: 'https://image.aladin.co.kr/cover.jpg',
            genre: 'NOVEL',
          },
        ],
      };
      mockBooksService.search.mockResolvedValue(serviceResult);

      const result = await controller.search({ query: '토지' });

      expect(result).toBe(serviceResult);
    });
  });

  describe('findOne', () => {
    it('책 id와 조회자 id를 service에 전달', async () => {
      mockBooksService.findOne.mockResolvedValue({ id: 'book-1' });

      const result = await controller.findOne('book-1', requestWithUser('user-1'));

      expect(mockBooksService.findOne).toHaveBeenCalledWith('book-1', 'user-1');
      expect(result).toEqual({ id: 'book-1' });
    });

    it('비로그인이면 viewerId는 undefined', async () => {
      mockBooksService.findOne.mockResolvedValue({ id: 'book-1' });

      await controller.findOne('book-1', requestWithUser());

      expect(mockBooksService.findOne).toHaveBeenCalledWith('book-1', undefined);
    });
  });

  describe('findNotes', () => {
    it('책 id, 조회자 id, cursor, limit을 service에 전달', async () => {
      mockBooksService.findNotes.mockResolvedValue({ items: [], nextCursor: null });

      await controller.findNotes('book-1', { cursor: 'c', limit: 5 }, requestWithUser('user-1'));

      expect(mockBooksService.findNotes).toHaveBeenCalledWith('book-1', 'user-1', 'c', 5);
    });
  });
});
