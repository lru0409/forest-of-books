import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { LibraryService } from './library.service';
import { PrismaService } from 'src/prisma/prisma.service';

type MockPrismaService = {
  libraryEntry: {
    findMany: jest.Mock;
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  book: {
    upsert: jest.Mock;
    create: jest.Mock;
  };
};

const createMockPrisma = (): MockPrismaService => ({
  libraryEntry: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  book: {
    upsert: jest.fn(),
    create: jest.fn(),
  },
});

const book = {
  id: 'book-1',
  isbn: '9780000000000',
  title: '토지',
  author: '박경리',
  genre: 'NOVEL',
  publisher: '나남출판',
  coverUrl: 'https://image.example.com/cover.jpg',
};

const entry = {
  id: 'entry-1',
  userId: 'user-1',
  bookId: 'book-1',
  status: 'READING',
  color: '#A27873',
  isPublic: true,
  rating: null,
  comment: null,
  note: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-02'),
  book,
};

describe('LibraryService', () => {
  let service: LibraryService;
  let mockPrisma: MockPrismaService;

  beforeEach(async () => {
    mockPrisma = createMockPrisma();

    const module: TestingModule = await Test.createTestingModule({
      providers: [LibraryService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<LibraryService>(LibraryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─────────────────────────────────────────────
  // findByUser
  // ─────────────────────────────────────────────
  describe('findByUser', () => {
    it('본인이 조회하면 공개여부 필터 없이 전체 조회', async () => {
      mockPrisma.libraryEntry.findMany.mockResolvedValue([entry]);

      await service.findByUser('user-1', 'user-1');

      expect(mockPrisma.libraryEntry.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: { book: true },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('타인이 조회하면 isPublic: true 필터 추가', async () => {
      mockPrisma.libraryEntry.findMany.mockResolvedValue([entry]);

      await service.findByUser('user-1', 'user-2');

      expect(mockPrisma.libraryEntry.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', isPublic: true },
        include: { book: true },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('viewerId 없으면(비로그인) isPublic: true 필터 추가', async () => {
      mockPrisma.libraryEntry.findMany.mockResolvedValue([entry]);

      await service.findByUser('user-1');

      expect(mockPrisma.libraryEntry.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', isPublic: true },
        include: { book: true },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('목록용 필드만 매핑해서 반환', async () => {
      mockPrisma.libraryEntry.findMany.mockResolvedValue([entry]);

      const result = await service.findByUser('user-1', 'user-1');

      expect(result).toEqual([
        {
          id: 'entry-1',
          title: '토지',
          author: '박경리',
          genre: 'NOVEL',
          coverUrl: book.coverUrl,
          status: 'READING',
          color: '#A27873',
          isPublic: true,
        },
      ]);
    });
  });

  // ─────────────────────────────────────────────
  // findOne
  // ─────────────────────────────────────────────
  describe('findOne', () => {
    it('항목이 없으면 NotFoundException', async () => {
      mockPrisma.libraryEntry.findUnique.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('공개 항목이면 비로그인이어도 조회 가능', async () => {
      mockPrisma.libraryEntry.findUnique.mockResolvedValue(entry);

      const result = await service.findOne('entry-1');

      expect(result.id).toBe('entry-1');
    });

    it('비공개 항목이고 본인이 아니면 NotFoundException', async () => {
      mockPrisma.libraryEntry.findUnique.mockResolvedValue({ ...entry, isPublic: false });

      await expect(service.findOne('entry-1', 'user-2')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('비공개 항목이어도 본인이면 조회 가능', async () => {
      mockPrisma.libraryEntry.findUnique.mockResolvedValue({ ...entry, isPublic: false });

      const result = await service.findOne('entry-1', 'user-1');

      expect(result.id).toBe('entry-1');
    });

    it('상세 응답에는 rating/comment/note/timestamp까지 포함', async () => {
      mockPrisma.libraryEntry.findUnique.mockResolvedValue({
        ...entry,
        rating: 5,
        comment: '좋았다',
        note: '자유 기록',
      });

      const result = await service.findOne('entry-1');

      expect(result).toEqual({
        id: 'entry-1',
        title: '토지',
        author: '박경리',
        genre: 'NOVEL',
        coverUrl: book.coverUrl,
        status: 'READING',
        color: '#A27873',
        isPublic: true,
        publisher: book.publisher,
        rating: 5,
        comment: '좋았다',
        note: '자유 기록',
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      });
    });
  });

  // ─────────────────────────────────────────────
  // create
  // ─────────────────────────────────────────────
  describe('create', () => {
    const bookInput = {
      title: '토지',
      author: '박경리',
      genre: 'NOVEL' as const,
      isbn: '9780000000000',
    };

    const noteInput = { color: '#A27873' };

    it('isbn이 있으면 upsert로 book 공유', async () => {
      mockPrisma.book.upsert.mockResolvedValue(book);
      mockPrisma.libraryEntry.create.mockResolvedValue(entry);

      await service.create('user-1', { book: bookInput, note: noteInput });

      expect(mockPrisma.book.upsert).toHaveBeenCalledWith({
        where: { isbn: bookInput.isbn },
        update: {},
        create: bookInput,
      });
      expect(mockPrisma.book.create).not.toHaveBeenCalled();
    });

    it('isbn이 없으면 항상 새 book 생성', async () => {
      const manualBook = { title: '수동입력', author: '작가', genre: 'ESSAY' as const };
      mockPrisma.book.create.mockResolvedValue({ ...book, isbn: null });
      mockPrisma.libraryEntry.create.mockResolvedValue(entry);

      await service.create('user-1', { book: manualBook, note: noteInput });

      expect(mockPrisma.book.create).toHaveBeenCalledWith({ data: manualBook });
      expect(mockPrisma.book.upsert).not.toHaveBeenCalled();
    });

    it('note에는 color만 있으면 userId/bookId/color만 담아 create', async () => {
      mockPrisma.book.upsert.mockResolvedValue(book);
      mockPrisma.libraryEntry.create.mockResolvedValue(entry);

      await service.create('user-1', { book: bookInput, note: noteInput });

      expect(mockPrisma.libraryEntry.create).toHaveBeenCalledWith({
        data: { userId: 'user-1', bookId: 'book-1', color: '#A27873' },
        include: { book: true },
      });
    });

    it('note로 넘긴 필드만 골라서 create (isPublic 포함)', async () => {
      mockPrisma.book.upsert.mockResolvedValue(book);
      mockPrisma.libraryEntry.create.mockResolvedValue(entry);

      await service.create('user-1', {
        book: bookInput,
        note: { ...noteInput, status: 'COMPLETED', isPublic: true },
      });

      expect(mockPrisma.libraryEntry.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          bookId: 'book-1',
          color: '#A27873',
          status: 'COMPLETED',
          isPublic: true,
        },
        include: { book: true },
      });
    });

    it('이미 서재에 있는 책이면 ConflictException (P2002)', async () => {
      mockPrisma.book.upsert.mockResolvedValue(book);
      const p2002Error = Object.assign(new Error('unique constraint'), { code: 'P2002' });
      mockPrisma.libraryEntry.create.mockRejectedValue(p2002Error);

      await expect(
        service.create('user-1', { book: bookInput, note: noteInput }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('P2002가 아닌 에러는 그대로 던짐', async () => {
      mockPrisma.book.upsert.mockResolvedValue(book);
      const otherError = new Error('db down');
      mockPrisma.libraryEntry.create.mockRejectedValue(otherError);

      await expect(
        service.create('user-1', { book: bookInput, note: noteInput }),
      ).rejects.toBe(otherError);
    });
  });

  // ─────────────────────────────────────────────
  // update
  // ─────────────────────────────────────────────
  describe('update', () => {
    it('항목이 없으면 NotFoundException', async () => {
      mockPrisma.libraryEntry.findUnique.mockResolvedValue(null);

      await expect(service.update('missing', 'user-1', {})).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(mockPrisma.libraryEntry.update).not.toHaveBeenCalled();
    });

    it('본인 항목이면 넘긴 필드만 update', async () => {
      mockPrisma.libraryEntry.findUnique.mockResolvedValue(entry);
      mockPrisma.libraryEntry.update.mockResolvedValue({ ...entry, isPublic: false });

      await service.update('entry-1', 'user-1', { isPublic: false });

      expect(mockPrisma.libraryEntry.update).toHaveBeenCalledWith({
        where: { id: 'entry-1' },
        data: { isPublic: false },
        include: { book: true },
      });
    });

    it('남의 공개 항목이면 ForbiddenException', async () => {
      mockPrisma.libraryEntry.findUnique.mockResolvedValue({ ...entry, isPublic: true });

      await expect(service.update('entry-1', 'user-2', {})).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(mockPrisma.libraryEntry.update).not.toHaveBeenCalled();
    });

    it('남의 비공개 항목이면 NotFoundException', async () => {
      mockPrisma.libraryEntry.findUnique.mockResolvedValue({ ...entry, isPublic: false });

      await expect(service.update('entry-1', 'user-2', {})).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(mockPrisma.libraryEntry.update).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────
  // remove
  // ─────────────────────────────────────────────
  describe('remove', () => {
    it('항목이 없으면 NotFoundException', async () => {
      mockPrisma.libraryEntry.findUnique.mockResolvedValue(null);

      await expect(service.remove('missing', 'user-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(mockPrisma.libraryEntry.delete).not.toHaveBeenCalled();
    });

    it('본인 항목이면 삭제', async () => {
      mockPrisma.libraryEntry.findUnique.mockResolvedValue(entry);

      await service.remove('entry-1', 'user-1');

      expect(mockPrisma.libraryEntry.delete).toHaveBeenCalledWith({ where: { id: 'entry-1' } });
    });

    it('남의 공개 항목이면 ForbiddenException', async () => {
      mockPrisma.libraryEntry.findUnique.mockResolvedValue({ ...entry, isPublic: true });

      await expect(service.remove('entry-1', 'user-2')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(mockPrisma.libraryEntry.delete).not.toHaveBeenCalled();
    });

    it('남의 비공개 항목이면 NotFoundException', async () => {
      mockPrisma.libraryEntry.findUnique.mockResolvedValue({ ...entry, isPublic: false });

      await expect(service.remove('entry-1', 'user-2')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(mockPrisma.libraryEntry.delete).not.toHaveBeenCalled();
    });
  });
});
