import { Test, TestingModule } from '@nestjs/testing';

import { LATEST_SORT } from 'src/common/pagination/cursor';
import { FeedItemsService, FeedEntry, feedEntryInclude } from 'src/feed/feed-items.service';
import { PrismaService } from 'src/prisma/prisma.service';

import { BookmarksService } from './bookmarks.service';

type MockPrismaService = { bookmark: { findMany: jest.Mock } };
type MockFeedItemsService = { toFeedItems: jest.Mock };

const makeRow = (
  id: string,
  entryId: string,
  createdAt: Date,
  entry: { isPublic: boolean; userId: string },
) => ({
  id,
  userId: 'viewer-1',
  entryId,
  createdAt,
  entry: { id: entryId, ...entry } as FeedEntry,
});

const t = (day: number) => new Date(`2026-01-0${day}T00:00:00.000Z`);

describe('BookmarksService', () => {
  let service: BookmarksService;
  let mockPrisma: MockPrismaService;
  let mockFeedItems: MockFeedItemsService;

  beforeEach(async () => {
    mockPrisma = { bookmark: { findMany: jest.fn().mockResolvedValue([]) } };
    mockFeedItems = {
      toFeedItems: jest
        .fn()
        .mockImplementation((entries: FeedEntry[]) =>
          Promise.resolve(entries.map((entry) => ({ entryId: entry.id }))),
        ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookmarksService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: FeedItemsService, useValue: mockFeedItems },
      ],
    }).compile();

    service = module.get<BookmarksService>(BookmarksService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('저장 시각 최신순으로 limit+1개 조회', async () => {
    await service.findMine('viewer-1', undefined, 10);

    expect(mockPrisma.bookmark.findMany).toHaveBeenCalledWith({
      where: { userId: 'viewer-1' },
      orderBy: LATEST_SORT.orderBy,
      take: 11,
      include: { entry: { include: feedEntryInclude } },
    });
  });

  it('cursor가 있으면 keyset 조건을 추가', async () => {
    const cursor = LATEST_SORT.encode({ createdAt: t(5), id: 'b-9' });

    await service.findMine('viewer-1', cursor, 10);

    expect(mockPrisma.bookmark.findMany).toHaveBeenCalledWith({
      where: {
        userId: 'viewer-1',
        OR: [{ createdAt: { lt: t(5) } }, { createdAt: t(5), id: { lt: 'b-9' } }],
      },
      orderBy: LATEST_SORT.orderBy,
      take: 11,
      include: { entry: { include: feedEntryInclude } },
    });
  });

  it('공개 노트는 post를 채우고, 비공개로 바뀐 남의 노트는 자리표시(post null)만 반환', async () => {
    mockPrisma.bookmark.findMany.mockResolvedValue([
      makeRow('b-3', 'e-3', t(3), { isPublic: true, userId: 'author-1' }),
      makeRow('b-2', 'e-2', t(2), { isPublic: false, userId: 'author-1' }),
      makeRow('b-1', 'e-1', t(1), { isPublic: true, userId: 'author-2' }),
    ]);

    const result = await service.findMine('viewer-1', undefined, 10);

    expect(mockFeedItems.toFeedItems).toHaveBeenCalledWith(
      [expect.objectContaining({ id: 'e-3' }), expect.objectContaining({ id: 'e-1' })],
      'viewer-1',
    );
    expect(result).toEqual({
      items: [
        {
          bookmarkId: 'b-3',
          entryId: 'e-3',
          createdAt: t(3),
          isAvailable: true,
          post: { entryId: 'e-3' },
        },
        { bookmarkId: 'b-2', entryId: 'e-2', createdAt: t(2), isAvailable: false, post: null },
        {
          bookmarkId: 'b-1',
          entryId: 'e-1',
          createdAt: t(1),
          isAvailable: true,
          post: { entryId: 'e-1' },
        },
      ],
      nextCursor: null,
    });
  });

  it('내가 쓴 노트는 비공개여도 내용을 보여줌', async () => {
    mockPrisma.bookmark.findMany.mockResolvedValue([
      makeRow('b-1', 'e-1', t(1), { isPublic: false, userId: 'viewer-1' }),
    ]);

    const result = await service.findMine('viewer-1', undefined, 10);

    expect(result.items[0]).toEqual({
      bookmarkId: 'b-1',
      entryId: 'e-1',
      createdAt: t(1),
      isAvailable: true,
      post: { entryId: 'e-1' },
    });
  });

  it('limit+1개가 조회되면 limit개만 반환하고 마지막 저장 기록으로 nextCursor 생성', async () => {
    mockPrisma.bookmark.findMany.mockResolvedValue([
      makeRow('b-3', 'e-3', t(3), { isPublic: true, userId: 'author-1' }),
      makeRow('b-2', 'e-2', t(2), { isPublic: true, userId: 'author-1' }),
      makeRow('b-1', 'e-1', t(1), { isPublic: true, userId: 'author-1' }),
    ]);

    const result = await service.findMine('viewer-1', undefined, 2);

    expect(result.items.map((item) => item.bookmarkId)).toEqual(['b-3', 'b-2']);
    expect(result.nextCursor).toBe(LATEST_SORT.encode({ createdAt: t(2), id: 'b-2' }));
  });
});
