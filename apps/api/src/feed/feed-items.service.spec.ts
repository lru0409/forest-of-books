import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from 'src/prisma/prisma.service';

import { FeedEntry, FeedItemsService } from './feed-items.service';

type MockPrismaService = {
  like: { findMany: jest.Mock };
  bookmark: { findMany: jest.Mock };
  follow: { findMany: jest.Mock };
  libraryEntry: { findMany: jest.Mock };
};

const createMockPrisma = (): MockPrismaService => ({
  like: { findMany: jest.fn().mockResolvedValue([]) },
  bookmark: { findMany: jest.fn().mockResolvedValue([]) },
  follow: { findMany: jest.fn().mockResolvedValue([]) },
  libraryEntry: { findMany: jest.fn().mockResolvedValue([]) },
});

const createdAt = new Date('2026-01-01T00:00:00.000Z');

const makeEntry = (overrides: Partial<FeedEntry> = {}): FeedEntry => ({
  id: 'entry-1',
  userId: 'author-1',
  bookId: 'book-1',
  status: 'COMPLETED',
  color: '#A27873',
  isPublic: true,
  rating: 4,
  comment: '한줄평',
  note: '짧은 노트',
  likeCount: 3,
  viewCount: 10,
  createdAt,
  updatedAt: createdAt,
  user: { id: 'author-1', nickname: 'author', profileImage: 'img.png' },
  book: {
    id: 'book-1',
    isbn: null,
    title: '책',
    author: '저자',
    genre: 'NOVEL',
    publisher: null,
    coverUrl: 'cover.png',
    createdAt,
  },
  ...overrides,
});

describe('FeedItemsService', () => {
  let service: FeedItemsService;
  let mockPrisma: MockPrismaService;

  beforeEach(async () => {
    mockPrisma = createMockPrisma();

    const module: TestingModule = await Test.createTestingModule({
      providers: [FeedItemsService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<FeedItemsService>(FeedItemsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('항목이 없으면 DB 조회 없이 빈 배열 반환', async () => {
    const result = await service.toFeedItems([], 'viewer-1');

    expect(result).toEqual([]);
    expect(mockPrisma.like.findMany).not.toHaveBeenCalled();
  });

  it('비로그인이면 조회자 상태 조회 없이 기본값으로 변환', async () => {
    const result = await service.toFeedItems([makeEntry()], undefined);

    expect(result).toEqual([
      {
        entryId: 'entry-1',
        user: { id: 'author-1', nickname: 'author', profileImage: 'img.png', isFollowing: false },
        book: {
          id: 'book-1',
          title: '책',
          author: '저자',
          coverUrl: 'cover.png',
          genre: 'NOVEL',
        },
        rating: 4,
        comment: '한줄평',
        notePreview: '짧은 노트',
        createdAt,
        likeCount: 3,
        viewCount: 10,
        isLiked: false,
        isBookmarked: false,
        myLibraryEntryId: null,
      },
    ]);
    expect(mockPrisma.like.findMany).not.toHaveBeenCalled();
    expect(mockPrisma.bookmark.findMany).not.toHaveBeenCalled();
    expect(mockPrisma.follow.findMany).not.toHaveBeenCalled();
    expect(mockPrisma.libraryEntry.findMany).not.toHaveBeenCalled();
  });

  it('로그인이면 페이지 전체를 in 쿼리 한 번씩으로 조회자 상태를 채움', async () => {
    const entries = [
      makeEntry(),
      makeEntry({
        id: 'entry-2',
        userId: 'author-2',
        bookId: 'book-2',
        user: { id: 'author-2', nickname: 'author2', profileImage: '' },
        book: { ...makeEntry().book, id: 'book-2' },
      }),
    ];
    mockPrisma.like.findMany.mockResolvedValue([{ entryId: 'entry-2' }]);
    mockPrisma.bookmark.findMany.mockResolvedValue([{ entryId: 'entry-1' }]);
    mockPrisma.follow.findMany.mockResolvedValue([{ followingId: 'author-1' }]);
    mockPrisma.libraryEntry.findMany.mockResolvedValue([{ id: 'my-entry', bookId: 'book-2' }]);

    const result = await service.toFeedItems(entries, 'viewer-1');

    expect(mockPrisma.like.findMany).toHaveBeenCalledWith({
      where: { userId: 'viewer-1', entryId: { in: ['entry-1', 'entry-2'] } },
      select: { entryId: true },
    });
    expect(mockPrisma.bookmark.findMany).toHaveBeenCalledWith({
      where: { userId: 'viewer-1', entryId: { in: ['entry-1', 'entry-2'] } },
      select: { entryId: true },
    });
    expect(mockPrisma.follow.findMany).toHaveBeenCalledWith({
      where: { followerId: 'viewer-1', followingId: { in: ['author-1', 'author-2'] } },
      select: { followingId: true },
    });
    expect(mockPrisma.libraryEntry.findMany).toHaveBeenCalledWith({
      where: { userId: 'viewer-1', bookId: { in: ['book-1', 'book-2'] } },
      select: { id: true, bookId: true },
    });
    expect(result.map((item) => item.user.isFollowing)).toEqual([true, false]);
    expect(result.map((item) => item.isLiked)).toEqual([false, true]);
    expect(result.map((item) => item.isBookmarked)).toEqual([true, false]);
    expect(result.map((item) => item.myLibraryEntryId)).toEqual([null, 'my-entry']);
  });

  describe('notePreview', () => {
    it('노트가 없으면 null', async () => {
      const [item] = await service.toFeedItems([makeEntry({ note: null })], undefined);

      expect(item?.notePreview).toBeNull();
    });

    it('200자 이하면 그대로', async () => {
      const note = 'a'.repeat(200);

      const [item] = await service.toFeedItems([makeEntry({ note })], undefined);

      expect(item?.notePreview).toBe(note);
    });

    it('200자를 넘으면 잘라서 말줄임표를 붙임', async () => {
      const [item] = await service.toFeedItems([makeEntry({ note: 'a'.repeat(201) })], undefined);

      expect(item?.notePreview).toBe(`${'a'.repeat(200)}…`);
    });

    it('이모지 같은 서로게이트 쌍을 중간에 자르지 않음', async () => {
      const note = '😀'.repeat(201);

      const [item] = await service.toFeedItems([makeEntry({ note })], undefined);

      expect(item?.notePreview).toBe(`${'😀'.repeat(200)}…`);
    });
  });
});
