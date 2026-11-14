import { NotFoundException } from '@nestjs/common';

import type { BookmarksService } from 'src/bookmarks/bookmarks.service';
import type { PostsService } from 'src/posts/posts.service';

// 실제 DB를 쓰는 테스트라서 로컬 DB를 TEST_DATABASE_URL로 지정했을 때만 실행한다.
// (프로덕션 DB를 건드리지 않도록 localhost/127.0.0.1이 아니면 건너뜀)

// 테스트 실행 명령
// cd apps/api
// TEST_DATABASE_URL=postgresql://rowoon@localhost:5432/forest_of_books_test \
//   pnpm exec jest --config ./test/jest-e2e.json post-interactions --forceExit

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

describeWithDb('post interactions (real db)', () => {
  const NICKNAME_PREFIX = 'interaction-test-';
  const BOOK_TITLE_PREFIX = 'interaction-test-book-';
  const BASE_TIME = new Date('2026-01-01T00:00:00.000Z').getTime();

  let prisma: (typeof import('@repo/db'))['prisma'];
  let postsService: PostsService;
  let bookmarksService: BookmarksService;

  beforeAll(async () => {
    // @repo/db는 import 시점의 DATABASE_URL로 Pool을 만들기 때문에 import 전에 바꿔야 함
    process.env.DATABASE_URL = TEST_DATABASE_URL;
    ({ prisma } = await import('@repo/db'));
    const { PrismaService } = await import('src/prisma/prisma.service');
    const { FeedItemsService } = await import('src/feed/feed-items.service');
    const { PostsService } = await import('src/posts/posts.service');
    const { BookmarksService } = await import('src/bookmarks/bookmarks.service');
    const prismaService = new PrismaService();
    const feedItems = new FeedItemsService(prismaService);
    postsService = new PostsService(prismaService, feedItems);
    bookmarksService = new BookmarksService(prismaService, feedItems);
  });

  const deleteTestData = async () => {
    // LibraryEntry는 User/Book 삭제 시 cascade되지 않으므로 먼저 지운다 (좋아요/저장/조회는 entry에 cascade)
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

  const createEntry = (userId: string, bookId: string, isPublic = true) =>
    prisma.libraryEntry.create({ data: { userId, bookId, isPublic } });

  const setup = async () => {
    const author = await createUser('author');
    const reader = await createUser('reader');
    const book = await createBook('1');
    const entry = await createEntry(author.id, book.id);
    return { author, reader, book, entry };
  };

  const countsOf = (entryId: string) =>
    prisma.libraryEntry.findUniqueOrThrow({
      where: { id: entryId },
      select: { likeCount: true, viewCount: true },
    });

  describe('like', () => {
    it('같은 유저가 동시에 여러 번 좋아요해도 likeCount는 1', async () => {
      const { reader, entry } = await setup();

      await Promise.all(Array.from({ length: 5 }, () => postsService.like(entry.id, reader.id)));

      expect(await countsOf(entry.id)).toMatchObject({ likeCount: 1 });
      expect(await prisma.like.count({ where: { entryId: entry.id } })).toBe(1);
    });

    it('서로 다른 유저의 좋아요는 각각 센다', async () => {
      const { author, reader, entry } = await setup();

      await postsService.like(entry.id, reader.id);
      await postsService.like(entry.id, author.id);

      expect(await countsOf(entry.id)).toMatchObject({ likeCount: 2 });
    });

    it('좋아요 취소는 한 번만 내리고, 안 한 상태에서 취소해도 0 아래로 내려가지 않음', async () => {
      const { reader, entry } = await setup();
      await postsService.like(entry.id, reader.id);

      await postsService.unlike(entry.id, reader.id);
      await postsService.unlike(entry.id, reader.id);

      expect(await countsOf(entry.id)).toMatchObject({ likeCount: 0 });
    });

    it('비공개 노트에는 좋아요할 수 없지만, 비공개로 바뀐 뒤에도 취소는 할 수 있음', async () => {
      const { reader, entry } = await setup();
      await postsService.like(entry.id, reader.id);
      await prisma.libraryEntry.update({ where: { id: entry.id }, data: { isPublic: false } });

      await expect(postsService.like(entry.id, reader.id)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      await postsService.unlike(entry.id, reader.id);

      expect(await countsOf(entry.id)).toMatchObject({ likeCount: 0 });
    });

    it('없는 노트에는 NotFoundException', async () => {
      const { reader } = await setup();

      await expect(postsService.like('missing', reader.id)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('좋아요 상태가 상세 응답의 isLiked/likeCount에 반영됨', async () => {
      const { reader, entry } = await setup();
      await postsService.like(entry.id, reader.id);

      const detail = await postsService.findOne(entry.id, reader.id);

      expect(detail).toMatchObject({ likeCount: 1, isLiked: true });
    });
  });

  describe('view', () => {
    const viewKeysOf = async (entryId: string) =>
      (await prisma.entryView.findMany({ where: { entryId } })).map((view) => view.viewerKey);

    it('같은 유저는 하루에 한 번만 센다', async () => {
      const { reader, entry } = await setup();

      await postsService.recordView(entry.id, reader.id, '1.1.1.1');
      await postsService.recordView(entry.id, reader.id, '1.1.1.1');

      expect(await countsOf(entry.id)).toMatchObject({ viewCount: 1 });
    });

    it('동시에 여러 번 호출해도 한 번만 센다', async () => {
      const { reader, entry } = await setup();

      await Promise.all(
        Array.from({ length: 5 }, () => postsService.recordView(entry.id, reader.id, '1.1.1.1')),
      );

      expect(await countsOf(entry.id)).toMatchObject({ viewCount: 1 });
    });

    it('비로그인은 IP별로 한 번씩 세고, IP 원문은 저장하지 않음', async () => {
      const { entry } = await setup();

      await postsService.recordView(entry.id, undefined, '1.1.1.1');
      await postsService.recordView(entry.id, undefined, '1.1.1.1');
      await postsService.recordView(entry.id, undefined, '2.2.2.2');

      expect(await countsOf(entry.id)).toMatchObject({ viewCount: 2 });
      const keys = await viewKeysOf(entry.id);
      expect(keys).toHaveLength(2);
      expect(keys.every((key) => key.startsWith('ip:') && !key.includes('.'))).toBe(true);
    });

    it('작성자 본인의 조회는 세지 않음', async () => {
      const { author, entry } = await setup();

      await postsService.recordView(entry.id, author.id, '1.1.1.1');

      expect(await countsOf(entry.id)).toMatchObject({ viewCount: 0 });
      expect(await viewKeysOf(entry.id)).toEqual([]);
    });

    it('어제 센 조회자도 오늘은 다시 센다', async () => {
      const { reader, entry } = await setup();
      const yesterday = new Date(`${new Date(Date.now() - 86_400_000).toISOString().slice(0, 10)}`);
      await prisma.entryView.create({
        data: { entryId: entry.id, viewerKey: `user:${reader.id}`, day: yesterday },
      });

      await postsService.recordView(entry.id, reader.id, '1.1.1.1');

      expect(await countsOf(entry.id)).toMatchObject({ viewCount: 1 });
    });

    it('비공개 노트는 작성자 외에게 NotFoundException', async () => {
      const { reader, entry } = await setup();
      await prisma.libraryEntry.update({ where: { id: entry.id }, data: { isPublic: false } });

      await expect(postsService.recordView(entry.id, reader.id, '1.1.1.1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('bookmark', () => {
    it('중복 저장해도 한 건이고, 취소는 멱등', async () => {
      const { reader, entry } = await setup();

      await Promise.all([
        postsService.bookmark(entry.id, reader.id),
        postsService.bookmark(entry.id, reader.id),
      ]);
      expect(await prisma.bookmark.count({ where: { entryId: entry.id } })).toBe(1);

      await postsService.unbookmark(entry.id, reader.id);
      await postsService.unbookmark(entry.id, reader.id);
      expect(await prisma.bookmark.count({ where: { entryId: entry.id } })).toBe(0);
    });

    it('비공개 노트는 저장할 수 없음', async () => {
      const { reader, entry } = await setup();
      await prisma.libraryEntry.update({ where: { id: entry.id }, data: { isPublic: false } });

      await expect(postsService.bookmark(entry.id, reader.id)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('saved list', () => {
    // 저장 순서: e1 → e2 → e3 (목록은 최신 저장순: e3, e2, e1)
    const setupSaved = async () => {
      const author = await createUser('author');
      const reader = await createUser('reader');
      const books = await Promise.all([1, 2, 3].map((n) => createBook(String(n))));
      const entries = await Promise.all(books.map((book) => createEntry(author.id, book.id)));
      const bookmarks = [];
      for (const [index, entry] of entries.entries()) {
        bookmarks.push(
          await prisma.bookmark.create({
            data: {
              userId: reader.id,
              entryId: entry.id,
              createdAt: new Date(BASE_TIME + index * 1000),
            },
          }),
        );
      }
      return { author, reader, entries, bookmarks };
    };

    it('저장한 노트를 최신 저장순으로 cursor 페이지네이션', async () => {
      const { reader, entries } = await setupSaved();
      const [e1, e2, e3] = entries;

      const first = await bookmarksService.findMine(reader.id, undefined, 2);
      expect(first.items.map((item) => item.entryId)).toEqual([e3!.id, e2!.id]);
      expect(first.items.every((item) => item.isAvailable && item.post?.isBookmarked)).toBe(true);

      const second = await bookmarksService.findMine(reader.id, first.nextCursor!, 2);
      expect(second.items.map((item) => item.entryId)).toEqual([e1!.id]);
      expect(second.nextCursor).toBeNull();
    });

    it('cursor가 가리키는 저장을 취소해도 다음 페이지에 남은 항목을 반환', async () => {
      const { reader, entries } = await setupSaved();
      const [e1, e2] = entries;

      const first = await bookmarksService.findMine(reader.id, undefined, 2);
      await postsService.unbookmark(e2!.id, reader.id);

      const second = await bookmarksService.findMine(reader.id, first.nextCursor!, 2);
      expect(second.items.map((item) => item.entryId)).toEqual([e1!.id]);
    });

    it('작성자가 비공개로 전환한 노트는 자리표시만 남고, 다시 공개하면 복구됨', async () => {
      const { reader, entries } = await setupSaved();
      const [, e2] = entries;
      await prisma.libraryEntry.update({ where: { id: e2!.id }, data: { isPublic: false } });

      const hidden = await bookmarksService.findMine(reader.id, undefined, 10);
      const placeholder = hidden.items.find((item) => item.entryId === e2!.id);
      expect(placeholder).toMatchObject({ isAvailable: false, post: null });
      expect(hidden.items).toHaveLength(3);

      await prisma.libraryEntry.update({ where: { id: e2!.id }, data: { isPublic: true } });

      const restored = await bookmarksService.findMine(reader.id, undefined, 10);
      expect(restored.items.find((item) => item.entryId === e2!.id)).toMatchObject({
        isAvailable: true,
      });
    });

    it('노트가 삭제되면 저장함에서도 사라짐', async () => {
      const { reader, entries } = await setupSaved();
      const [, e2] = entries;
      await prisma.libraryEntry.delete({ where: { id: e2!.id } });

      const result = await bookmarksService.findMine(reader.id, undefined, 10);

      expect(result.items.map((item) => item.entryId)).not.toContain(e2!.id);
      expect(result.items).toHaveLength(2);
    });

    it('내가 쓴 노트를 저장해 둔 뒤 비공개로 바꿔도 내 저장함에서는 그대로 보임', async () => {
      const reader = await createUser('reader');
      const book = await createBook('mine');
      const mine = await createEntry(reader.id, book.id);
      await postsService.bookmark(mine.id, reader.id);
      await prisma.libraryEntry.update({ where: { id: mine.id }, data: { isPublic: false } });

      const result = await bookmarksService.findMine(reader.id, undefined, 10);

      expect(result.items[0]).toMatchObject({ entryId: mine.id, isAvailable: true });
    });

    it('다른 유저의 저장은 보이지 않음', async () => {
      const { author } = await setupSaved();

      const result = await bookmarksService.findMine(author.id, undefined, 10);

      expect(result.items).toEqual([]);
    });
  });
});
