import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { BooksService } from './books.service';
import { ALADIN_SEARCH_URL } from './lib/constants';

type MockConfigService = {
  get: jest.Mock;
};

const createMockConfigService = (config: Record<string, string>): MockConfigService => ({
  get: jest.fn((key: string) => config[key]),
});

const makeFetchResponse = (overrides: { ok?: boolean; status?: number; json: unknown }) => ({
  ok: overrides.ok ?? true,
  status: overrides.status ?? 200,
  json: jest.fn().mockResolvedValue(overrides.json),
});

describe('BooksService', () => {
  let service: BooksService;
  let mockConfigService: MockConfigService;
  let fetchSpy: jest.SpyInstance;

  beforeEach(async () => {
    mockConfigService = createMockConfigService({ API_ALADIN_TTB_KEY: 'test-ttb-key' });
    fetchSpy = jest.spyOn(global, 'fetch');

    const module: TestingModule = await Test.createTestingModule({
      providers: [BooksService, { provide: ConfigService, useValue: mockConfigService }],
    }).compile();

    service = module.get<BooksService>(BooksService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('search', () => {
    it('API_ALADIN_TTB_KEY 없으면 InternalServerErrorException', async () => {
      mockConfigService = createMockConfigService({});
      const module: TestingModule = await Test.createTestingModule({
        providers: [BooksService, { provide: ConfigService, useValue: mockConfigService }],
      }).compile();
      service = module.get<BooksService>(BooksService);

      await expect(service.search('토지')).rejects.toThrow(InternalServerErrorException);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('Aladin 응답이 실패(ok: false)면 InternalServerErrorException', async () => {
      fetchSpy.mockResolvedValue(
        makeFetchResponse({ ok: false, status: 500, json: {} }) as unknown as Response,
      );

      await expect(service.search('토지')).rejects.toThrow(InternalServerErrorException);
    });

    it('Aladin 응답에 errorCode가 있으면 BadRequestException', async () => {
      fetchSpy.mockResolvedValue(
        makeFetchResponse({
          json: { totalResults: 0, errorCode: 100, errorMessage: '잘못된 요청' },
        }) as unknown as Response,
      );

      await expect(service.search('토지')).rejects.toThrow(BadRequestException);
    });

    it('정상 케이스: item 배열을 SearchBookItemDto로 매핑', async () => {
      fetchSpy.mockResolvedValue(
        makeFetchResponse({
          json: {
            totalResults: 1,
            item: [
              {
                itemId: 123456,
                title: '토지',
                author: '박경리',
                pubDate: '1994-01-01',
                description: '설명',
                publisher: '나남출판',
                isbn13: '9788930057000',
                cover: 'https://image.aladin.co.kr/cover.jpg',
                categoryName: '국내도서>소설/시/희곡>한국소설',
                bestRank: 1,
              },
            ],
          },
        }) as unknown as Response,
      );

      const result = await service.search('토지');

      expect(result).toEqual({
        total: 1,
        items: [
          {
            id: '123456',
            title: '토지',
            author: '박경리',
            publisher: '나남출판',
            isbn: '9788930057000',
            coverUrl: 'https://image.aladin.co.kr/cover.jpg',
            genre: 'NOVEL',
          },
        ],
      });
    });

    it('data.item이 없으면 빈 배열 반환', async () => {
      fetchSpy.mockResolvedValue(
        makeFetchResponse({ json: { totalResults: 0 } }) as unknown as Response,
      );

      const result = await service.search('없는책');

      expect(result).toEqual({ total: 0, items: [] });
    });

    it('categoryName이 없는 item이면 genre: OTHER', async () => {
      fetchSpy.mockResolvedValue(
        makeFetchResponse({
          json: {
            totalResults: 1,
            item: [
              {
                itemId: 111,
                title: '분류없음',
                author: '작가',
                pubDate: '2020-01-01',
                description: '',
                publisher: '출판사',
                isbn13: '9780000000000',
                cover: 'https://image.aladin.co.kr/none.jpg',
                categoryName: '',
                bestRank: 0,
              },
            ],
          },
        }) as unknown as Response,
      );

      const result = await service.search('분류없음');

      expect(result.items[0]?.genre).toBe('OTHER');
    });

    it('query/page/limit로 Aladin API를 올바른 파라미터로 호출', async () => {
      fetchSpy.mockResolvedValue(
        makeFetchResponse({ json: { totalResults: 0 } }) as unknown as Response,
      );

      await service.search('토지', 2, 20);

      const calledUrl = fetchSpy.mock.calls[0][0] as string;
      expect(calledUrl.startsWith(ALADIN_SEARCH_URL)).toBe(true);

      const calledParams = new URLSearchParams(calledUrl.split('?')[1]);
      expect(calledParams.get('ttbkey')).toBe('test-ttb-key');
      expect(calledParams.get('Query')).toBe('토지');
      expect(calledParams.get('QueryType')).toBe('Keyword');
      expect(calledParams.get('SearchTarget')).toBe('Book');
      expect(calledParams.get('start')).toBe('2');
      expect(calledParams.get('MaxResults')).toBe('20');
    });
  });
});
