import { NotFoundException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';

import type { BooksService } from 'src/books/books.service';

// 실제 DB를 쓰는 테스트라서 로컬 DB를 TEST_DATABASE_URL로 지정했을 때만 실행한다.
// (프로덕션 DB를 건드리지 않도록 localhost/127.0.0.1이 아니면 건너뜀)

// 테스트 실행 명령
// cd apps/api
// TEST_DATABASE_URL=postgresql://rowoon@localhost:5432/forest_of_books_test \
//   pnpm exec jest --config ./test/jest-e2e.json book-community --forceExit

// eslint-disable-next-line turbo/no-undeclared-env-vars -- turbo가 아니라 직접 실행하는 테스트
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

function isLocalDatabase(url: string | undefined): url is string {
  if (!url) return false;
  try {
    return ['localhost', '127.0.0.1'].includes(new URL(url).hostname);
  } catch {
    return false;
  }
}

const describeWithDb = isLocalDatabase(TEST_DATABASE_URL) ? describe : describe.skip;

describeWithDb('book detail, community panel, library bookId (real db)', () => {
  const NICKNAME_PREFIX = 'community-test-';
  const BOOK_TITLE_PREFIX = 'community-test-book-';

  let prisma: (typeof import('@repo/db'))['prisma'];
  let booksService: BooksService;

  beforeAll(async () => {
    // @repo/db는 import 시점의 DATABASE_URL로 Pool을 만들기 때문에 import 전에 바꿔야 함
    process.env.DATABASE_URL = TEST_DATABASE_URL;
    ({ prisma } = await import('@repo/db'));
    const { PrismaService } = await import('src/prisma/prisma.service');
    const { FeedItemsService } = await import('src/feed/feed-items.service');
    const { BooksService } = await import('src/books/books.service');
    const prismaService = new PrismaService();
    booksService = new BooksService(
      { get: () => undefined } as unknown as ConfigService,
      prismaService,
      new FeedItemsService(prismaService),
    );
  });

  const deleteTestData = async () => {
    // LibraryEntry는 User/Book 삭제 시 cascade되지 않으므로 먼저 지운다
    await prisma.libraryEntry.deleteMany({
      where: { user: { nickname: { startsWith: NICKNAME_PREFIX } } },
    });
    await prisma.user.deleteMany({ where: { nickname: { startsWith: NICKNAME_PREFIX } } });
    await prisma.book.deleteMany({ where: { title: { startsWith: BOOK_TITLE_PREFIX } } });
  };

  beforeEach(deleteTestData);
  afterEach(deleteTestData);
  afterAll(() => prisma.$disconnect());

  const createUser = (name: string) =>
    prisma.user.create({
      data: { nickname: `${NICKNAME_PREFIX}${name}`, bio: '', profileImage: '' },
    });

  const createBook = (name: string) =>
    prisma.book.create({
      data: { title: `${BOOK_TITLE_PREFIX}${name}`, author: 'author', genre: 'NOVEL' },
    });

  type EntryOptions = {
    isPublic?: boolean;
    status?: 'NOT_STARTED' | 'READING' | 'COMPLETED' | 'ON_HOLD';
    rating?: number;
    likeCount?: number;
    createdAt?: Date;
  };
  const createEntry = (userId: string, bookId: string, options: EntryOptions = {}) =>
    prisma.libraryEntry.create({
      data: {
        userId,
        bookId,
        isPublic: options.isPublic ?? true,
        status: options.status ?? 'NOT_STARTED',
        rating: options.rating ?? null,
        likeCount: options.likeCount ?? 0,
        ...(options.createdAt && { createdAt: options.createdAt }),
      },
    });

  describe('book detail', () => {
    it('공개 노트 수/평균 별점은 공개 항목만, 읽는 중/읽은 수는 비공개 포함 전체로 집계', async () => {
      const [a, b, c, d] = await Promise.all(['a', 'b', 'c', 'd'].map(createUser));
      const book = await createBook('1');
      await createEntry(a!.id, book.id, { status: 'READING', rating: 5 });
      await createEntry(b!.id, book.id, { status: 'COMPLETED', rating: 4 });
      await createEntry(c!.id, book.id, { status: 'COMPLETED', rating: 1, isPublic: false });
      await createEntry(d!.id, book.id, { status: 'NOT_STARTED' });

      const detail = await booksService.findOne(book.id);

      expect(detail).toMatchObject({
        id: book.id,
        publicNoteCount: 3,
        averageRating: 4.5,
        readingCount: 1,
        completedCount: 2,
        myLibraryEntryId: null,
      });
    });

    it('공개 별점이 없으면 averageRating은 null', async () => {
      const a = await createUser('a');
      const book = await createBook('1');
      await createEntry(a.id, book.id, { rating: 3, isPublic: false });

      const detail = await booksService.findOne(book.id);

      expect(detail).toMatchObject({ publicNoteCount: 0, averageRating: null });
    });

    it('로그인하면 내 서재 항목 id를 돌려줌', async () => {
      const a = await createUser('a');
      const b = await createUser('b');
      const book = await createBook('1');
      const mine = await createEntry(a.id, book.id, { isPublic: false });

      expect((await booksService.findOne(book.id, a.id)).myLibraryEntryId).toBe(mine.id);
      expect((await booksService.findOne(book.id, b.id)).myLibraryEntryId).toBeNull();
    });

    it('없는 책은 NotFoundException', async () => {
      await expect(booksService.findOne('missing')).rejects.toBeInstanceOf(NotFoundException);
      await expect(booksService.findNotes('missing', undefined)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('book notes', () => {
    const t = (n: number) => new Date(Date.UTC(2026, 0, 1, 0, 0, n));

    const setup = async () => {
      const users = await Promise.all(['a', 'b', 'c', 'd'].map(createUser));
      const book = await createBook('1');
      const otherBook = await createBook('2');
      const oldest = await createEntry(users[0]!.id, book.id, { createdAt: t(1) });
      const middle = await createEntry(users[1]!.id, book.id, { createdAt: t(2) });
      const newest = await createEntry(users[2]!.id, book.id, { createdAt: t(3) });
      await createEntry(users[3]!.id, book.id, { createdAt: t(4), isPublic: false });
      await createEntry(users[3]!.id, otherBook.id, { createdAt: t(5) });
      return { book, oldest, middle, newest };
    };

    it('그 책의 공개 노트만 최신순으로 cursor 페이지네이션', async () => {
      const { book, oldest, middle, newest } = await setup();

      const first = await booksService.findNotes(book.id, undefined, undefined, 2);
      expect(first.items.map((item) => item.entryId)).toEqual([newest.id, middle.id]);

      const second = await booksService.findNotes(book.id, undefined, first.nextCursor!, 2);
      expect(second.items.map((item) => item.entryId)).toEqual([oldest.id]);
      expect(second.nextCursor).toBeNull();
    });

    it('cursor가 가리키는 노트가 삭제돼도 다음 페이지에 남은 노트를 반환', async () => {
      const { book, oldest, middle, newest } = await setup();

      const first = await booksService.findNotes(book.id, undefined, undefined, 2);
      expect(first.items.map((item) => item.entryId)).toEqual([newest.id, middle.id]);
      await prisma.libraryEntry.delete({ where: { id: middle.id } });

      const second = await booksService.findNotes(book.id, undefined, first.nextCursor!, 2);
      expect(second.items.map((item) => item.entryId)).toEqual([oldest.id]);
    });
  });
});
