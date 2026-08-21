import { Test, TestingModule } from '@nestjs/testing';

import { BooksController } from './books.controller';
import { BooksService } from './books.service';

type MockBooksService = {
  search: jest.Mock;
};

const createMockBooksService = (): MockBooksService => ({
  search: jest.fn(),
});

describe('BooksController', () => {
  let controller: BooksController;
  let mockBooksService: MockBooksService;

  beforeEach(async () => {
    mockBooksService = createMockBooksService();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BooksController],
      providers: [{ provide: BooksService, useValue: mockBooksService }],
    }).compile();

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

    it('page/limit 문자열을 숫자로 변환하여 service 호출', async () => {
      mockBooksService.search.mockResolvedValue({ total: 0, items: [] });

      await controller.search({ query: '토지', page: '2', limit: '20' });

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
});
