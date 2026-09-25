import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import type { User } from '@repo/db';
import { PrismaService } from 'src/prisma/prisma.service';

import { FollowListResponseDto, FollowUserResponseDto } from './dto';

const DEFAULT_LIMIT = 20;

@Injectable()
export class FollowService {
  constructor(private readonly prisma: PrismaService) {}

  async follow(followerId: string, followingId: string): Promise<void> {
    if (followerId === followingId) {
      throw new BadRequestException('자기 자신을 팔로우할 수 없습니다.');
    }

    const target = await this.prisma.user.findUnique({ where: { id: followingId } });
    if (!target) throw new NotFoundException('유저를 찾을 수 없습니다.');

    await this.prisma.follow.upsert({
      where: { followerId_followingId: { followerId, followingId } },
      update: {},
      create: { followerId, followingId },
    });
  }

  async unfollow(followerId: string, followingId: string): Promise<void> {
    await this.prisma.follow.deleteMany({ where: { followerId, followingId } });
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const follow = await this.prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });
    return follow !== null;
  }

  async getCounts(userId: string): Promise<{ followerCount: number; followingCount: number }> {
    const [followerCount, followingCount] = await Promise.all([
      this.prisma.follow.count({ where: { followingId: userId } }),
      this.prisma.follow.count({ where: { followerId: userId } }),
    ]);
    return { followerCount, followingCount };
  }

  async getFollowers(
    userId: string,
    viewerId: string | undefined,
    cursor?: string,
    limit = DEFAULT_LIMIT,
  ): Promise<FollowListResponseDto> {
    const rows = await this.prisma.follow.findMany({
      where: { followingId: userId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      include: { follower: true },
    });

    const entries = rows.map((row) => ({ followId: row.id, user: row.follower }));
    return this.toListResponse(entries, viewerId, limit);
  }

  async getFollowing(
    userId: string,
    viewerId: string | undefined,
    cursor?: string,
    limit = DEFAULT_LIMIT,
  ): Promise<FollowListResponseDto> {
    const rows = await this.prisma.follow.findMany({
      where: { followerId: userId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      include: { following: true },
    });

    const entries = rows.map((row) => ({ followId: row.id, user: row.following }));
    return this.toListResponse(entries, viewerId, limit);
  }

  private async toListResponse(
    entries: { followId: string; user: User }[],
    viewerId: string | undefined,
    limit: number,
  ): Promise<FollowListResponseDto> {
    const hasMore = entries.length > limit;
    const page = entries.slice(0, limit);

    const followingIds = viewerId
      ? new Set(
          (
            await this.prisma.follow.findMany({
              where: { followerId: viewerId },
              select: { followingId: true },
            })
          ).map((row) => row.followingId),
        )
      : new Set<string>();

    const items: FollowUserResponseDto[] = page.map(({ user }) => ({
      id: user.id,
      nickname: user.nickname,
      bio: user.bio,
      profileImage: user.profileImage,
      isFollowing: followingIds.has(user.id),
    }));

    const lastEntry = page[page.length - 1];
    return { items, nextCursor: hasMore && lastEntry ? lastEntry.followId : null };
  }
}
