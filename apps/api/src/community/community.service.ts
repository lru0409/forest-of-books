import { Injectable } from '@nestjs/common';

import { POPULAR_WINDOW_MS } from 'src/feed/constants/feed.constant';
import { PrismaService } from 'src/prisma/prisma.service';

import { CommunityBookResponseDto, CommunityUserResponseDto } from './dto';

const DEFAULT_LIMIT = 5;

@Injectable()
export class CommunityService {
  constructor(private readonly prisma: PrismaService) {}

  // 최근 공개된 노트를 책별로 묶어 좋아요 합계, 노트 수 순으로 정렬한다
  async getPopularBooks(limit = DEFAULT_LIMIT): Promise<CommunityBookResponseDto[]> {
    const groups = await this.prisma.libraryEntry.groupBy({
      by: ['bookId'],
      where: { isPublic: true, createdAt: { gte: new Date(Date.now() - POPULAR_WINDOW_MS) } },
      _sum: { likeCount: true },
      _count: { _all: true },
      orderBy: [
        { _sum: { likeCount: 'desc' } },
        { _count: { bookId: 'desc' } },
        { bookId: 'desc' },
      ],
      take: limit,
    });
    if (groups.length === 0) return [];

    const books = await this.prisma.book.findMany({
      where: { id: { in: groups.map((group) => group.bookId) } },
    });
    const bookById = new Map(books.map((book) => [book.id, book]));

    return groups.flatMap((group) => {
      const book = bookById.get(group.bookId);
      if (!book) return [];

      return [
        {
          book: {
            id: book.id,
            title: book.title,
            author: book.author,
            coverUrl: book.coverUrl,
            genre: book.genre,
          },
          noteCount: group._count._all,
          likeCount: group._sum.likeCount ?? 0,
        },
      ];
    });
  }

  // 공개 노트가 있는 유저를 팔로워 많은 순으로. 나는 제외한다
  async getUsers(
    viewerId: string | undefined,
    limit = DEFAULT_LIMIT,
  ): Promise<CommunityUserResponseDto[]> {
    const users = await this.prisma.user.findMany({
      where: {
        libraryEntries: { some: { isPublic: true } },
        ...(viewerId && { id: { not: viewerId } }),
      },
      orderBy: [{ followers: { _count: 'desc' } }, { createdAt: 'desc' }, { id: 'desc' }],
      take: limit,
      select: {
        id: true,
        nickname: true,
        bio: true,
        profileImage: true,
        _count: { select: { followers: true } },
      },
    });

    const followingIds = viewerId
      ? new Set(
          (
            await this.prisma.follow.findMany({
              where: { followerId: viewerId, followingId: { in: users.map((user) => user.id) } },
              select: { followingId: true },
            })
          ).map((follow) => follow.followingId),
        )
      : new Set<string>();

    return users.map((user) => ({
      id: user.id,
      nickname: user.nickname,
      bio: user.bio,
      profileImage: user.profileImage,
      isFollowing: followingIds.has(user.id),
      followerCount: user._count.followers,
    }));
  }
}
