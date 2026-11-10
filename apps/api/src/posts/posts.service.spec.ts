import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { FeedItemsService, feedEntryInclude } from 'src/feed/feed-items.service';
import { PrismaService } from 'src/prisma/prisma.service';

import { PostsService } from './posts.service';

type MockPrismaService = { libraryEntry: { findUnique: jest.Mock } };
type MockFeedItemsService = { toFeedItems: jest.Mock };

const entry = { id: 'entry-1', userId: 'author-1', isPublic: true, note: '전체 노트' };
const feedItem = { entryId: 'entry-1', notePreview: '전체 노트' };

describe('PostsService', () => {
  let service: PostsService;
  let mockPrisma: MockPrismaService;
  let mockFeedItems: MockFeedItemsService;

  beforeEach(async () => {
    mockPrisma = { libraryEntry: { findUnique: jest.fn() } };
    mockFeedItems = { toFeedItems: jest.fn().mockResolvedValue([feedItem]) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: FeedItemsService, useValue: mockFeedItems },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('공개 노트는 누구나 FeedItem과 전체 note를 받음', async () => {
    mockPrisma.libraryEntry.findUnique.mockResolvedValue(entry);

    const result = await service.findOne('entry-1', undefined);

    expect(mockPrisma.libraryEntry.findUnique).toHaveBeenCalledWith({
      where: { id: 'entry-1' },
      include: feedEntryInclude,
    });
    expect(mockFeedItems.toFeedItems).toHaveBeenCalledWith([entry], undefined);
    expect(result).toEqual({ ...feedItem, note: '전체 노트' });
  });

  it('비공개 노트도 작성자 본인은 조회 가능', async () => {
    mockPrisma.libraryEntry.findUnique.mockResolvedValue({ ...entry, isPublic: false });

    const result = await service.findOne('entry-1', 'author-1');

    expect(result).toEqual({ ...feedItem, note: '전체 노트' });
  });

  it('비공개 노트는 다른 유저에게 NotFoundException', async () => {
    mockPrisma.libraryEntry.findUnique.mockResolvedValue({ ...entry, isPublic: false });

    await expect(service.findOne('entry-1', 'other-user')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(mockFeedItems.toFeedItems).not.toHaveBeenCalled();
  });

  it('비공개 노트는 비로그인에게 NotFoundException', async () => {
    mockPrisma.libraryEntry.findUnique.mockResolvedValue({ ...entry, isPublic: false });

    await expect(service.findOne('entry-1', undefined)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('노트가 없으면 NotFoundException', async () => {
    mockPrisma.libraryEntry.findUnique.mockResolvedValue(null);

    await expect(service.findOne('missing', 'user-1')).rejects.toBeInstanceOf(NotFoundException);
  });
});
