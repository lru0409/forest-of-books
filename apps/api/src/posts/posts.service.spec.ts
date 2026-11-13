import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { FeedItemsService, feedEntryInclude } from 'src/feed/feed-items.service';
import { PrismaService } from 'src/prisma/prisma.service';

import { PostsService } from './posts.service';

type MockTx = {
  like: { createMany: jest.Mock; deleteMany: jest.Mock };
  entryView: { createMany: jest.Mock };
  libraryEntry: { update: jest.Mock };
};

type MockPrismaService = {
  libraryEntry: { findUnique: jest.Mock };
  bookmark: { createMany: jest.Mock; deleteMany: jest.Mock };
  $transaction: jest.Mock;
};
type MockFeedItemsService = { toFeedItems: jest.Mock };

const entry = { id: 'entry-1', userId: 'author-1', isPublic: true, note: '전체 노트' };
const feedItem = { entryId: 'entry-1', notePreview: '전체 노트' };

describe('PostsService', () => {
  let service: PostsService;
  let mockPrisma: MockPrismaService;
  let mockFeedItems: MockFeedItemsService;
  let mockTx: MockTx;

  beforeEach(async () => {
    mockTx = {
      like: { createMany: jest.fn(), deleteMany: jest.fn() },
      entryView: { createMany: jest.fn() },
      libraryEntry: { update: jest.fn() },
    };
    mockPrisma = {
      libraryEntry: { findUnique: jest.fn() },
      bookmark: { createMany: jest.fn(), deleteMany: jest.fn() },
      $transaction: jest
        .fn()
        .mockImplementation((callback: (tx: MockTx) => Promise<unknown>) => callback(mockTx)),
    };
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

  describe('like', () => {
    it('공개 노트면 좋아요를 만들고 새로 생긴 경우에만 likeCount를 올림', async () => {
      mockPrisma.libraryEntry.findUnique.mockResolvedValue({ isPublic: true });
      mockTx.like.createMany.mockResolvedValue({ count: 1 });

      await service.like('entry-1', 'user-1');

      expect(mockPrisma.libraryEntry.findUnique).toHaveBeenCalledWith({
        where: { id: 'entry-1' },
        select: { isPublic: true },
      });
      expect(mockTx.like.createMany).toHaveBeenCalledWith({
        data: [{ userId: 'user-1', entryId: 'entry-1' }],
        skipDuplicates: true,
      });
      expect(mockTx.libraryEntry.update).toHaveBeenCalledWith({
        where: { id: 'entry-1' },
        data: { likeCount: { increment: 1 } },
      });
    });

    it('이미 좋아요한 상태면 likeCount를 올리지 않음 (멱등)', async () => {
      mockPrisma.libraryEntry.findUnique.mockResolvedValue({ isPublic: true });
      mockTx.like.createMany.mockResolvedValue({ count: 0 });

      await service.like('entry-1', 'user-1');

      expect(mockTx.libraryEntry.update).not.toHaveBeenCalled();
    });

    it.each([
      ['비공개 노트', { isPublic: false }],
      ['없는 노트', null],
    ])('%s는 NotFoundException', async (_name, found) => {
      mockPrisma.libraryEntry.findUnique.mockResolvedValue(found);

      await expect(service.like('entry-1', 'user-1')).rejects.toBeInstanceOf(NotFoundException);
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('unlike', () => {
    it('좋아요가 있었으면 지우고 likeCount를 내림 (공개 여부 확인 없음)', async () => {
      mockTx.like.deleteMany.mockResolvedValue({ count: 1 });

      await service.unlike('entry-1', 'user-1');

      expect(mockPrisma.libraryEntry.findUnique).not.toHaveBeenCalled();
      expect(mockTx.like.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', entryId: 'entry-1' },
      });
      expect(mockTx.libraryEntry.update).toHaveBeenCalledWith({
        where: { id: 'entry-1' },
        data: { likeCount: { decrement: 1 } },
      });
    });

    it('좋아요가 없었으면 likeCount를 내리지 않음 (멱등)', async () => {
      mockTx.like.deleteMany.mockResolvedValue({ count: 0 });

      await service.unlike('entry-1', 'user-1');

      expect(mockTx.libraryEntry.update).not.toHaveBeenCalled();
    });
  });

  describe('bookmark', () => {
    it('공개 노트면 중복 없이 저장', async () => {
      mockPrisma.libraryEntry.findUnique.mockResolvedValue({ isPublic: true });

      await service.bookmark('entry-1', 'user-1');

      expect(mockPrisma.bookmark.createMany).toHaveBeenCalledWith({
        data: [{ userId: 'user-1', entryId: 'entry-1' }],
        skipDuplicates: true,
      });
    });

    it('비공개 노트는 NotFoundException', async () => {
      mockPrisma.libraryEntry.findUnique.mockResolvedValue({ isPublic: false });

      await expect(service.bookmark('entry-1', 'user-1')).rejects.toBeInstanceOf(NotFoundException);
      expect(mockPrisma.bookmark.createMany).not.toHaveBeenCalled();
    });
  });

  describe('unbookmark', () => {
    it('공개 여부 확인 없이 저장을 지움', async () => {
      await service.unbookmark('entry-1', 'user-1');

      expect(mockPrisma.libraryEntry.findUnique).not.toHaveBeenCalled();
      expect(mockPrisma.bookmark.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', entryId: 'entry-1' },
      });
    });
  });

  describe('recordView', () => {
    const NOW = new Date('2026-03-04T23:59:59.000Z');

    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(NOW);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    const publicEntry = { id: 'entry-1', userId: 'author-1', isPublic: true };

    it('로그인 유저는 user id를 키로, UTC 날짜 단위로 기록하고 새로 생기면 viewCount를 올림', async () => {
      mockPrisma.libraryEntry.findUnique.mockResolvedValue(publicEntry);
      mockTx.entryView.createMany.mockResolvedValue({ count: 1 });

      await service.recordView('entry-1', 'viewer-1', '1.2.3.4');

      expect(mockPrisma.libraryEntry.findUnique).toHaveBeenCalledWith({
        where: { id: 'entry-1' },
        select: { id: true, userId: true, isPublic: true },
      });
      expect(mockTx.entryView.createMany).toHaveBeenCalledWith({
        data: [
          {
            entryId: 'entry-1',
            viewerKey: 'user:viewer-1',
            day: new Date('2026-03-04T00:00:00.000Z'),
          },
        ],
        skipDuplicates: true,
      });
      expect(mockTx.libraryEntry.update).toHaveBeenCalledWith({
        where: { id: 'entry-1' },
        data: { viewCount: { increment: 1 } },
      });
    });

    it('비로그인은 IP 해시를 키로 쓰고 IP 원문은 저장하지 않음', async () => {
      mockPrisma.libraryEntry.findUnique.mockResolvedValue(publicEntry);
      mockTx.entryView.createMany.mockResolvedValue({ count: 1 });

      await service.recordView('entry-1', undefined, '1.2.3.4');

      expect(mockTx.entryView.createMany).toHaveBeenCalledWith({
        data: [
          {
            entryId: 'entry-1',
            // sha256('1.2.3.4')
            viewerKey: 'ip:6694f83c9f476da31f5df6bcc520034e7e57d421d247b9d34f49edbfc84a764c',
            day: new Date('2026-03-04T00:00:00.000Z'),
          },
        ],
        skipDuplicates: true,
      });
    });

    it('이미 오늘 센 조회자면 viewCount를 올리지 않음', async () => {
      mockPrisma.libraryEntry.findUnique.mockResolvedValue(publicEntry);
      mockTx.entryView.createMany.mockResolvedValue({ count: 0 });

      await service.recordView('entry-1', 'viewer-1', '1.2.3.4');

      expect(mockTx.libraryEntry.update).not.toHaveBeenCalled();
    });

    it('작성자 본인의 조회는 비공개 노트여도 조용히 무시', async () => {
      mockPrisma.libraryEntry.findUnique.mockResolvedValue({ ...publicEntry, isPublic: false });

      await service.recordView('entry-1', 'author-1', '1.2.3.4');

      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('다른 유저/비로그인이 비공개 노트를 조회하면 NotFoundException', async () => {
      mockPrisma.libraryEntry.findUnique.mockResolvedValue({ ...publicEntry, isPublic: false });

      await expect(service.recordView('entry-1', 'viewer-1', '1.2.3.4')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('없는 노트는 NotFoundException', async () => {
      mockPrisma.libraryEntry.findUnique.mockResolvedValue(null);

      await expect(service.recordView('missing', 'viewer-1', '1.2.3.4')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
