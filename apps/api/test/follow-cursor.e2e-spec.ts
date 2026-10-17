import { BadRequestException } from '@nestjs/common';

import type { FollowService } from 'src/follow/follow.service';

// 실제 DB를 쓰는 테스트라서 로컬 DB를 TEST_DATABASE_URL로 지정했을 때만 실행한다.
// (프로덕션 DB를 건드리지 않도록 localhost/127.0.0.1이 아니면 건너뜀)

// 테스트 실행 명령
// cd apps/api
// TEST_DATABASE_URL=postgresql://rowoon@localhost:5432/forest_of_books_test \
//   pnpm --filter api exec jest --config ./test/jest-e2e.json follow-cursor --forceExit

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

describeWithDb('follow list cursor (real db)', () => {
  const NICKNAME_PREFIX = 'cursor-test-';
  const BASE_TIME = new Date('2026-01-01T00:00:00.000Z').getTime();

  let prisma: (typeof import('@repo/db'))['prisma'];
  let service: FollowService;

  beforeAll(async () => {
    // @repo/db는 import 시점의 DATABASE_URL로 Pool을 만들기 때문에 import 전에 바꿔야 함
    process.env.DATABASE_URL = TEST_DATABASE_URL;
    ({ prisma } = await import('@repo/db'));
    const { PrismaService } = await import('src/prisma/prisma.service');
    const { FollowService } = await import('src/follow/follow.service');
    service = new FollowService(new PrismaService());
  });

  const deleteTestUsers = () =>
    prisma.user.deleteMany({ where: { nickname: { startsWith: NICKNAME_PREFIX } } });

  beforeEach(deleteTestUsers);
  afterEach(deleteTestUsers);
  afterAll(() => prisma.$disconnect());

  const createUser = (name: string) =>
    prisma.user.create({
      data: { nickname: `${NICKNAME_PREFIX}${name}`, bio: '', profileImage: '' },
    });

  // order가 클수록 최근에 팔로우한 것 (목록은 최신순)
  const follow = (followerId: string, followingId: string, order: number) =>
    prisma.follow.create({
      data: { followerId, followingId, createdAt: new Date(BASE_TIME + order * 1000) },
    });

  describe('getFollowing', () => {
    // viewer가 oldest → middle → newest 순으로 팔로우. 목록: [newest, middle, oldest]
    const setup = async () => {
      const viewer = await createUser('viewer');
      const oldest = await createUser('oldest');
      const middle = await createUser('middle');
      const newest = await createUser('newest');
      await follow(viewer.id, oldest.id, 1);
      await follow(viewer.id, middle.id, 2);
      await follow(viewer.id, newest.id, 3);
      return { viewer, oldest, middle, newest };
    };

    it('cursor row가 있으면 다음 페이지에 남은 유저를 반환', async () => {
      const { viewer, oldest, middle, newest } = await setup();

      const first = await service.getFollowing(viewer.id, viewer.id, undefined, 2);
      expect(first.items.map((item) => item.id)).toEqual([newest.id, middle.id]);
      expect(first.nextCursor).not.toBeNull();

      const second = await service.getFollowing(viewer.id, viewer.id, first.nextCursor!, 2);
      expect(second.items.map((item) => item.id)).toEqual([oldest.id]);
      expect(second.nextCursor).toBeNull();
    });

    it('cursor row가 언팔로우로 삭제돼도 다음 페이지에 남은 유저를 반환', async () => {
      const { viewer, oldest, middle, newest } = await setup();

      const first = await service.getFollowing(viewer.id, viewer.id, undefined, 2);
      expect(first.items.map((item) => item.id)).toEqual([newest.id, middle.id]);

      // 첫 페이지의 마지막 유저(= cursor가 가리키는 row)를 언팔로우
      await service.unfollow(viewer.id, middle.id);

      const second = await service.getFollowing(viewer.id, viewer.id, first.nextCursor!, 2);
      expect(second.items.map((item) => item.id)).toEqual([oldest.id]);
    });

    it('첫 페이지를 본 뒤 새로 팔로우해도 다음 페이지에 중복/누락이 없음', async () => {
      const { viewer, oldest, middle, newest } = await setup();

      const first = await service.getFollowing(viewer.id, viewer.id, undefined, 2);
      expect(first.items.map((item) => item.id)).toEqual([newest.id, middle.id]);

      const latest = await createUser('latest');
      await follow(viewer.id, latest.id, 4);

      const second = await service.getFollowing(viewer.id, viewer.id, first.nextCursor!, 2);
      expect(second.items.map((item) => item.id)).toEqual([oldest.id]);
    });

    it('cursor 형식이 잘못되면 BadRequestException', async () => {
      const { viewer } = await setup();

      await expect(
        service.getFollowing(viewer.id, viewer.id, 'cursor-1', 2),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('getFollowers', () => {
    // oldest → middle → newest 순으로 target을 팔로우. 목록: [newest, middle, oldest]
    const setup = async () => {
      const target = await createUser('target');
      const oldest = await createUser('oldest');
      const middle = await createUser('middle');
      const newest = await createUser('newest');
      await follow(oldest.id, target.id, 1);
      await follow(middle.id, target.id, 2);
      await follow(newest.id, target.id, 3);
      return { target, oldest, middle, newest };
    };

    it('cursor row가 언팔로우로 삭제돼도 다음 페이지에 남은 유저를 반환', async () => {
      const { target, oldest, middle, newest } = await setup();

      const first = await service.getFollowers(target.id, undefined, undefined, 2);
      expect(first.items.map((item) => item.id)).toEqual([newest.id, middle.id]);

      // 첫 페이지의 마지막 팔로워(= cursor가 가리키는 row)가 언팔로우
      await service.unfollow(middle.id, target.id);

      const second = await service.getFollowers(target.id, undefined, first.nextCursor!, 2);
      expect(second.items.map((item) => item.id)).toEqual([oldest.id]);
    });
  });
});
