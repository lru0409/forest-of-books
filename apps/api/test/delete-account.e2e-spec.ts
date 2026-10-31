import type { User } from '@repo/db';
import type { UsersService } from 'src/users/users.service';

// 실제 DB를 쓰는 테스트라서 로컬 DB를 TEST_DATABASE_URL로 지정했을 때만 실행한다.
// (프로덕션 DB를 건드리지 않도록 localhost/127.0.0.1이 아니면 건너뜀)

// 테스트 실행 명령
// cd apps/api
// TEST_DATABASE_URL=postgresql://rowoon@localhost:5432/forest_of_books_test \
//   pnpm --filter api exec jest --config ./test/jest-e2e.json delete-account --forceExit

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

describeWithDb('delete account (real db)', () => {
  const NICKNAME_PREFIX = 'delete-test-';
  const BOOK_TITLE_PREFIX = 'delete-test-book-';

  let prisma: (typeof import('@repo/db'))['prisma'];
  let service: UsersService;

  beforeAll(async () => {
    // @repo/db는 import 시점의 DATABASE_URL로 Pool을 만들기 때문에 import 전에 바꿔야 함
    process.env.DATABASE_URL = TEST_DATABASE_URL;
    ({ prisma } = await import('@repo/db'));
    const { PrismaService } = await import('src/prisma/prisma.service');
    const { FollowService } = await import('src/follow/follow.service');
    const { UsersService } = await import('src/users/users.service');
    const prismaService = new PrismaService();
    service = new UsersService(prismaService, new FollowService(prismaService));
  });

  const cleanUp = async () => {
    // LibraryEntry.userId는 Restrict라 유저보다 먼저 지워야 함. Follow는 유저 삭제 시 Cascade.
    await prisma.libraryEntry.deleteMany({
      where: { user: { nickname: { startsWith: NICKNAME_PREFIX } } },
    });
    await prisma.user.deleteMany({ where: { nickname: { startsWith: NICKNAME_PREFIX } } });
    await prisma.book.deleteMany({ where: { title: { startsWith: BOOK_TITLE_PREFIX } } });
  };

  beforeEach(cleanUp);
  afterEach(cleanUp);
  afterAll(() => prisma.$disconnect());

  const createUser = (name: string, password: string | null = null): Promise<User> =>
    prisma.user.create({
      data: { nickname: `${NICKNAME_PREFIX}${name}`, bio: '', profileImage: '', password },
    });

  // 서재 기록 2건 + 팔로워/팔로잉이 있는 유저와, 영향받으면 안 되는 다른 유저/책을 만든다
  const setup = async (target: User) => {
    const other = await createUser('other');
    const createBook = (suffix: string) =>
      prisma.book.create({
        data: { title: `${BOOK_TITLE_PREFIX}${suffix}`, author: 'author', genre: 'NOVEL' },
      });
    const firstBook = await createBook('1');
    const secondBook = await createBook('2');
    const books = [firstBook, secondBook];
    await prisma.libraryEntry.createMany({
      data: books.map((book) => ({ userId: target.id, bookId: book.id })),
    });
    await prisma.libraryEntry.create({ data: { userId: other.id, bookId: firstBook.id } });
    await prisma.follow.create({ data: { followerId: target.id, followingId: other.id } });
    await prisma.follow.create({ data: { followerId: other.id, followingId: target.id } });
    return { other, books };
  };

  const expectOnlyTargetDeleted = async (target: User, other: User, bookIds: string[]) => {
    await expect(prisma.user.findUnique({ where: { id: target.id } })).resolves.toBeNull();
    await expect(prisma.libraryEntry.count({ where: { userId: target.id } })).resolves.toBe(0);
    await expect(
      prisma.follow.count({
        where: { OR: [{ followerId: target.id }, { followingId: target.id }] },
      }),
    ).resolves.toBe(0);

    await expect(prisma.user.findUnique({ where: { id: other.id } })).resolves.not.toBeNull();
    await expect(prisma.libraryEntry.count({ where: { userId: other.id } })).resolves.toBe(1);
    await expect(prisma.book.count({ where: { id: { in: bookIds } } })).resolves.toBe(
      bookIds.length,
    );
  };

  it('소셜 계정: 서재 기록과 팔로우까지 FK 에러 없이 삭제하고 다른 유저 데이터는 유지', async () => {
    const target = await createUser('social');
    const { other, books } = await setup(target);

    await service.deleteMe(target, { nickname: target.nickname });

    await expectOnlyTargetDeleted(
      target,
      other,
      books.map((book) => book.id),
    );
  });

  it('비밀번호 계정: 비밀번호가 맞으면 삭제', async () => {
    const bcrypt = await import('bcrypt');
    const target = await createUser('password', await bcrypt.hash('Current1!', 10));
    const { other, books } = await setup(target);

    await service.deleteMe(target, { password: 'Current1!' });

    await expectOnlyTargetDeleted(
      target,
      other,
      books.map((book) => book.id),
    );
  });

  it('확인에 실패하면 아무것도 삭제하지 않음', async () => {
    const target = await createUser('rejected');
    await setup(target);

    await expect(service.deleteMe(target, { nickname: 'wrong' })).rejects.toThrow();

    await expect(prisma.user.findUnique({ where: { id: target.id } })).resolves.not.toBeNull();
    await expect(prisma.libraryEntry.count({ where: { userId: target.id } })).resolves.toBe(2);
  });
});
