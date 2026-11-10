import { NotFoundException } from '@nestjs/common';

import type { FeedService } from 'src/feed/feed.service';
import type { PostsService } from 'src/posts/posts.service';

// 실제 DB를 쓰는 테스트라서 로컬 DB를 TEST_DATABASE_URL로 지정했을 때만 실행한다.
// (프로덕션 DB를 건드리지 않도록 localhost/127.0.0.1이 아니면 건너뜀)

// 테스트 실행 명령
// cd apps/api
// TEST_DATABASE_URL=postgresql://rowoon@localhost:5432/forest_of_books_test \
//   pnpm exec jest --config ./test/jest-e2e.json feed-cursor --forceExit

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

describeWithDb('feed & post detail (real db)', () => {
  const NICKNAME_PREFIX = 'feed-test-';
  const BOOK_TITLE_PREFIX = 'feed-test-book-';
  const BASE_TIME = new Date('2026-01-01T00:00:00.000Z').getTime();

  let prisma: (typeof import('@repo/db'))['prisma'];
  let feedService: FeedService;
  let postsService: PostsService;
  let viewer: Awaited<ReturnType<typeof createUser>>;

  beforeAll(async () => {
    // @repo/db는 import 시점의 DATABASE_URL로 Pool을 만들기 때문에 import 전에 바꿔야 함
    process.env.DATABASE_URL = TEST_DATABASE_URL;
    ({ prisma } = await import('@repo/db'));
    const { PrismaService } = await import('src/prisma/prisma.service');
    const { FeedItemsService } = await import('src/feed/feed-items.service');
    const { FeedService } = await import('src/feed/feed.service');
    const { PostsService } = await import('src/posts/posts.service');
    const prismaService = new PrismaService();
    const feedItems = new FeedItemsService(prismaService);
    feedService = new FeedService(prismaService, feedItems);
    postsService = new PostsService(prismaService, feedItems);
  });

  // 인기 탭은 "최근 30일"이라서 현재 시각 기준으로 노트를 만든다.
  // order가 클수록 최근에 작성한 것 (목록은 최신순)
  const createdAtOf = (order: number) => new Date(Date.now() - 24 * 60 * 60 * 1000 + order * 1000);

  const deleteTestData = async () => {
    // LibraryEntry는 User/Book 삭제 시 cascade되지 않으므로 먼저 지운다 (좋아요/저장/조회는 entry에 cascade)
    await prisma.libraryEntry.deleteMany({
      where: { user: { nickname: { startsWith: NICKNAME_PREFIX } } },
    });
    await prisma.user.deleteMany({ where: { nickname: { startsWith: NICKNAME_PREFIX } } });
    await prisma.book.deleteMany({ where: { title: { startsWith: BOOK_TITLE_PREFIX } } });
  };

  beforeEach(async () => {
    await deleteTestData();
    viewer = await createUser('viewer');
  });
  afterEach(deleteTestData);
  afterAll(() => prisma.$disconnect());

  const createUser = (name: string, preferredGenres: ('NOVEL' | 'ESSAY')[] = []) =>
    prisma.user.create({
      data: { nickname: `${NICKNAME_PREFIX}${name}`, bio: '', profileImage: '', preferredGenres },
    });

  const createBook = (name: string, genre: 'NOVEL' | 'ESSAY' = 'NOVEL') =>
    prisma.book.create({
      data: { title: `${BOOK_TITLE_PREFIX}${name}`, author: 'author', genre },
    });

  const createEntry = (
    userId: string,
    bookId: string,
    options: { order?: number; isPublic?: boolean; likeCount?: number; note?: string } = {},
  ) =>
    prisma.libraryEntry.create({
      data: {
        userId,
        bookId,
        isPublic: options.isPublic ?? true,
        likeCount: options.likeCount ?? 0,
        note: options.note ?? null,
        createdAt: createdAtOf(options.order ?? 0),
      },
    });

  // 테스트 데이터만 골라서 본다 (로컬 DB에 다른 공개 노트가 있어도 영향받지 않게 하려고
  // 작성자를 테스트 유저로 제한할 수는 없으므로, 아래 헬퍼로 id 목록만 비교한다)
  const idsOf = (items: { entryId: string }[]) => items.map((item) => item.entryId);

  describe('latest', () => {
    // 로컬 DB에 테스트 외의 공개 노트가 섞여 있을 수 있으므로 시각을 아주 먼 미래로 두어 항상 맨 앞에 오게 한다
    const farFuture = (order: number) =>
      new Date(BASE_TIME + 100 * 365 * 24 * 3600 * 1000 + order * 1000);

    const setup = async () => {
      const author = await createUser('author');
      const [b1, b2, b3] = await Promise.all([createBook('1'), createBook('2'), createBook('3')]);
      const mk = (bookId: string, order: number, isPublic = true) =>
        prisma.libraryEntry.create({
          data: { userId: author.id, bookId, isPublic, createdAt: farFuture(order) },
        });
      const oldest = await mk(b1!.id, 1);
      const middle = await mk(b2!.id, 2);
      const newest = await mk(b3!.id, 3);
      return { author, oldest, middle, newest };
    };

    it('최신순으로 cursor 페이지네이션', async () => {
      const { oldest, middle, newest } = await setup();

      const first = await feedService.getFeed(undefined, 'latest', undefined, 2);
      expect(idsOf(first.items)).toEqual([newest.id, middle.id]);
      expect(first.nextCursor).not.toBeNull();

      const second = await feedService.getFeed(undefined, 'latest', first.nextCursor!, 2);
      expect(idsOf(second.items).slice(0, 1)).toEqual([oldest.id]);
    });

    it('cursor가 가리키는 노트가 삭제돼도 다음 페이지에 남은 노트를 반환', async () => {
      const { oldest, middle, newest } = await setup();

      const first = await feedService.getFeed(undefined, 'latest', undefined, 2);
      expect(idsOf(first.items)).toEqual([newest.id, middle.id]);

      await prisma.libraryEntry.delete({ where: { id: middle.id } });

      const second = await feedService.getFeed(undefined, 'latest', first.nextCursor!, 2);
      expect(idsOf(second.items).slice(0, 1)).toEqual([oldest.id]);
    });

    it('첫 페이지를 본 뒤 새 노트가 올라와도 다음 페이지에 중복/누락이 없음', async () => {
      const { author, oldest, middle, newest } = await setup();

      const first = await feedService.getFeed(undefined, 'latest', undefined, 2);
      expect(idsOf(first.items)).toEqual([newest.id, middle.id]);

      const book = await createBook('4');
      await prisma.libraryEntry.create({
        data: { userId: author.id, bookId: book.id, createdAt: farFuture(4) },
      });

      const second = await feedService.getFeed(undefined, 'latest', first.nextCursor!, 2);
      expect(idsOf(second.items).slice(0, 1)).toEqual([oldest.id]);
    });

    it('비공개 노트는 피드에 나오지 않음', async () => {
      const { author } = await setup();
      const book = await createBook('private');
      const hidden = await prisma.libraryEntry.create({
        data: { userId: author.id, bookId: book.id, isPublic: false, createdAt: farFuture(9) },
      });

      const result = await feedService.getFeed(viewer, 'latest', undefined, 50);

      expect(idsOf(result.items)).not.toContain(hidden.id);
    });
  });

  describe('popular', () => {
    // likeCount 순, 같으면 최신순. 좋아요 수를 크게 줘서 로컬 DB의 다른 노트보다 항상 앞에 오게 한다
    const BIG = 1_000_000;

    const setup = async () => {
      const author = await createUser('author');
      const books = await Promise.all([1, 2, 3, 4].map((n) => createBook(String(n))));
      const [a, b, c, d] = await Promise.all([
        createEntry(author.id, books[0]!.id, { order: 1, likeCount: BIG + 5 }),
        createEntry(author.id, books[1]!.id, { order: 2, likeCount: BIG + 5 }),
        createEntry(author.id, books[2]!.id, { order: 3, likeCount: BIG + 9 }),
        createEntry(author.id, books[3]!.id, { order: 4, likeCount: BIG + 1 }),
      ]);
      // 정렬: c(9) → b(5, 더 최근) → a(5) → d(1)
      return { a: a!, b: b!, c: c!, d: d! };
    };

    it('좋아요순, 동률이면 최신순으로 cursor 페이지네이션', async () => {
      const { a, b, c, d } = await setup();

      const first = await feedService.getFeed(undefined, 'popular', undefined, 2);
      expect(idsOf(first.items)).toEqual([c.id, b.id]);

      const second = await feedService.getFeed(undefined, 'popular', first.nextCursor!, 2);
      expect(idsOf(second.items)).toEqual([a.id, d.id]);
    });

    it('동률 구간 한가운데에서 끊어도 중복/누락이 없음', async () => {
      const { a, b, c } = await setup();

      const first = await feedService.getFeed(undefined, 'popular', undefined, 2);
      expect(idsOf(first.items)).toEqual([c.id, b.id]);

      // 첫 페이지의 마지막(b) 이후에 같은 likeCount의 a가 이어져야 함
      const second = await feedService.getFeed(undefined, 'popular', first.nextCursor!, 1);
      expect(idsOf(second.items)).toEqual([a.id]);
    });

    it('30일보다 오래된 노트는 제외', async () => {
      const author = await createUser('author');
      const book = await createBook('old');
      const old = await prisma.libraryEntry.create({
        data: {
          userId: author.id,
          bookId: book.id,
          likeCount: BIG * 2,
          createdAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000),
        },
      });

      const result = await feedService.getFeed(undefined, 'popular', undefined, 50);

      expect(idsOf(result.items)).not.toContain(old.id);
    });
  });

  describe('following', () => {
    it('팔로우한 유저의 공개 노트만 반환', async () => {
      const followed = await createUser('followed');
      const stranger = await createUser('stranger');
      await prisma.follow.create({ data: { followerId: viewer.id, followingId: followed.id } });
      const [b1, b2, b3] = await Promise.all([createBook('1'), createBook('2'), createBook('3')]);
      const mine = await createEntry(followed.id, b1!.id, { order: 1 });
      await createEntry(followed.id, b2!.id, { order: 2, isPublic: false });
      await createEntry(stranger.id, b3!.id, { order: 3 });

      const result = await feedService.getFeed(viewer, 'following', undefined, 20);

      expect(idsOf(result.items)).toEqual([mine.id]);
      expect(result.items[0]?.user.isFollowing).toBe(true);
    });
  });

  describe('recommended', () => {
    it('선호 장르 또는 팔로잉 노트만 보이고 내 노트는 제외', async () => {
      const viewerWithTaste = await createUser('taste', ['ESSAY']);
      const followed = await createUser('followed');
      const stranger = await createUser('stranger');
      await prisma.follow.create({
        data: { followerId: viewerWithTaste.id, followingId: followed.id },
      });
      const [novel, essay, mineBook, followedBook] = await Promise.all([
        createBook('novel', 'NOVEL'),
        createBook('essay', 'ESSAY'),
        createBook('mine', 'ESSAY'),
        createBook('followed', 'NOVEL'),
      ]);
      await createEntry(stranger.id, novel!.id, { order: 1 });
      const genreMatch = await createEntry(stranger.id, essay!.id, { order: 2 });
      await createEntry(viewerWithTaste.id, mineBook!.id, { order: 3 });
      const followMatch = await createEntry(followed.id, followedBook!.id, { order: 4 });

      const result = await feedService.getFeed(viewerWithTaste, 'recommended', undefined, 50);

      const testIds = idsOf(result.items).filter((id) =>
        [genreMatch.id, followMatch.id].includes(id),
      );
      expect(testIds).toEqual([followMatch.id, genreMatch.id]);
      expect(result.items.some((item) => item.user.id === viewerWithTaste.id)).toBe(false);
      expect(result.items.some((item) => item.book.title === `${BOOK_TITLE_PREFIX}novel`)).toBe(
        false,
      );
    });
  });

  describe('viewer state', () => {
    it('좋아요/저장/내 서재 항목 여부를 채움', async () => {
      const author = await createUser('author');
      const book = await createBook('1');
      const entry = await createEntry(author.id, book.id, { order: 1, likeCount: 1, note: '노트' });
      const mine = await createEntry(viewer.id, book.id, { order: 2, isPublic: false });
      await prisma.like.create({ data: { userId: viewer.id, entryId: entry.id } });
      await prisma.bookmark.create({ data: { userId: viewer.id, entryId: entry.id } });

      const detail = await postsService.findOne(entry.id, viewer.id);

      expect(detail).toMatchObject({
        entryId: entry.id,
        note: '노트',
        isLiked: true,
        isBookmarked: true,
        myLibraryEntryId: mine.id,
      });
      expect(detail.user).toEqual({
        id: author.id,
        nickname: author.nickname,
        profileImage: '',
        isFollowing: false,
      });
    });
  });

  describe('post detail visibility', () => {
    it('비공개 노트는 작성자만 조회하고 다른 유저/비로그인은 NotFoundException', async () => {
      const author = await createUser('author');
      const book = await createBook('1');
      const entry = await createEntry(author.id, book.id, { isPublic: false });

      await expect(postsService.findOne(entry.id, author.id)).resolves.toMatchObject({
        entryId: entry.id,
      });
      await expect(postsService.findOne(entry.id, viewer.id)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      await expect(postsService.findOne(entry.id, undefined)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
