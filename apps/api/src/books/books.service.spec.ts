import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { LATEST_SORT } from 'src/common/pagination/cursor';
import { FeedItemsService, feedEntryInclude } from 'src/feed/feed-items.service';
import { PrismaService } from 'src/prisma/prisma.service';

import { BooksService } from './books.service';
import { ALADIN_SEARCH_URL } from './lib/constants';

type MockConfigService = {
  get: jest.Mock;
};

type MockPrismaService = {
  book: { findUnique: jest.Mock };
  libraryEntry: {
    count: jest.Mock;
    aggregate: jest.Mock;
    findUnique: jest.Mock;
    findMany: jest.Mock;
  };
};

type MockFeedItemsService = { toFeedItems: jest.Mock };

const createMockPrisma = (): MockPrismaService => ({
  book: { findUnique: jest.fn() },
  libraryEntry: {
    count: jest.fn(),
    aggregate: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
});

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
  let mockPrisma: MockPrismaService;
  let mockFeedItems: MockFeedItemsService;
  let fetchSpy: jest.SpyInstance;

  beforeEach(async () => {
    mockConfigService = createMockConfigService({ API_ALADIN_TTB_KEY: 'test-ttb-key' });
    mockPrisma = createMockPrisma();
    mockFeedItems = { toFeedItems: jest.fn() };
    fetchSpy = jest.spyOn(global, 'fetch');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BooksService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: FeedItemsService, useValue: mockFeedItems },
      ],
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
        providers: [
          BooksService,
          { provide: ConfigService, useValue: mockConfigService },
          { provide: PrismaService, useValue: mockPrisma },
          { provide: FeedItemsService, useValue: mockFeedItems },
        ],
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

  describe('findOne', () => {
    const book = {
      id: 'book-1',
      title: '토지',
      author: '박경리',
      genre: 'NOVEL',
      publisher: '나남출판',
      coverUrl: 'cover.png',
    };

    const setupCounts = (average: number | null) => {
      mockPrisma.book.findUnique.mockResolvedValue(book);
      mockPrisma.libraryEntry.count.mockImplementation(
        ({ where }: { where: { isPublic?: boolean; status?: string } }) =>
          Promise.resolve(where.isPublic ? 7 : where.status === 'READING' ? 3 : 5),
      );
      mockPrisma.libraryEntry.aggregate.mockResolvedValue({ _avg: { rating: average } });
    };

    it('책이 없으면 NotFoundException', async () => {
      mockPrisma.book.findUnique.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('책 정보와 통계를 반환하고, 비로그인이면 내 서재 조회 없이 myLibraryEntryId는 null', async () => {
      setupCounts(4.26);

      const result = await service.findOne('book-1');

      expect(result).toEqual({
        id: 'book-1',
        title: '토지',
        author: '박경리',
        genre: 'NOVEL',
        publisher: '나남출판',
        coverUrl: 'cover.png',
        publicNoteCount: 7,
        averageRating: 4.3,
        readingCount: 3,
        completedCount: 5,
        myLibraryEntryId: null,
      });
      expect(mockPrisma.libraryEntry.count).toHaveBeenCalledWith({
        where: { bookId: 'book-1', isPublic: true },
      });
      expect(mockPrisma.libraryEntry.aggregate).toHaveBeenCalledWith({
        where: { bookId: 'book-1', isPublic: true, rating: { not: null } },
        _avg: { rating: true },
      });
      expect(mockPrisma.libraryEntry.count).toHaveBeenCalledWith({
        where: { bookId: 'book-1', status: 'READING' },
      });
      expect(mockPrisma.libraryEntry.count).toHaveBeenCalledWith({
        where: { bookId: 'book-1', status: 'COMPLETED' },
      });
      expect(mockPrisma.libraryEntry.findUnique).not.toHaveBeenCalled();
    });

    it('공개 별점이 하나도 없으면 averageRating은 null', async () => {
      setupCounts(null);

      const result = await service.findOne('book-1');

      expect(result.averageRating).toBeNull();
    });

    it('로그인하면 내 서재의 해당 책 항목 id를 반환', async () => {
      setupCounts(4);
      mockPrisma.libraryEntry.findUnique.mockResolvedValue({ id: 'my-entry' });

      const result = await service.findOne('book-1', 'user-1');

      expect(mockPrisma.libraryEntry.findUnique).toHaveBeenCalledWith({
        where: { userId_bookId: { userId: 'user-1', bookId: 'book-1' } },
        select: { id: true },
      });
      expect(result.myLibraryEntryId).toBe('my-entry');
    });

    it('로그인했지만 내 서재에 없으면 myLibraryEntryId는 null', async () => {
      setupCounts(4);
      mockPrisma.libraryEntry.findUnique.mockResolvedValue(null);

      const result = await service.findOne('book-1', 'user-1');

      expect(result.myLibraryEntryId).toBeNull();
    });
  });

  describe('findNotes', () => {
    const t = (day: number) => new Date(`2026-01-0${day}T00:00:00.000Z`);

    beforeEach(() => {
      mockPrisma.book.findUnique.mockResolvedValue({ id: 'book-1' });
      mockPrisma.libraryEntry.findMany.mockResolvedValue([]);
      mockFeedItems.toFeedItems.mockImplementation((rows: unknown[]) => Promise.resolve(rows));
    });

    it('책이 없으면 NotFoundException', async () => {
      mockPrisma.book.findUnique.mockResolvedValue(null);

      await expect(service.findNotes('missing', undefined)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(mockPrisma.libraryEntry.findMany).not.toHaveBeenCalled();
    });

    it('그 책의 공개 노트를 최신순으로 limit+1개 조회', async () => {
      await service.findNotes('book-1', 'user-1', undefined, 10);

      expect(mockPrisma.libraryEntry.findMany).toHaveBeenCalledWith({
        where: { bookId: 'book-1', isPublic: true },
        orderBy: LATEST_SORT.orderBy,
        take: 11,
        include: feedEntryInclude,
      });
    });

    it('cursor가 있으면 keyset 조건을 추가', async () => {
      const cursor = LATEST_SORT.encode({ createdAt: t(5), id: 'e-9' });

      await service.findNotes('book-1', undefined, cursor, 10);

      expect(mockPrisma.libraryEntry.findMany).toHaveBeenCalledWith({
        where: {
          bookId: 'book-1',
          isPublic: true,
          OR: [{ createdAt: { lt: t(5) } }, { createdAt: t(5), id: { lt: 'e-9' } }],
        },
        orderBy: LATEST_SORT.orderBy,
        take: 11,
        include: feedEntryInclude,
      });
    });

    it('limit+1개가 조회되면 limit개만 변환하고 마지막 항목으로 nextCursor 생성', async () => {
      const rows = [
        { id: 'e-3', createdAt: t(3) },
        { id: 'e-2', createdAt: t(2) },
        { id: 'e-1', createdAt: t(1) },
      ];
      mockPrisma.libraryEntry.findMany.mockResolvedValue(rows);

      const result = await service.findNotes('book-1', 'user-1', undefined, 2);

      expect(mockFeedItems.toFeedItems).toHaveBeenCalledWith(rows.slice(0, 2), 'user-1');
      expect(result).toEqual({
        items: rows.slice(0, 2),
        nextCursor: LATEST_SORT.encode({ createdAt: t(2), id: 'e-2' }),
      });
    });
  });
});
