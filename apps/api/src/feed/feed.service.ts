import { Injectable, UnauthorizedException } from '@nestjs/common';

import type { Prisma, User } from '@repo/db';
import { LATEST_SORT, POPULAR_SORT } from 'src/common/pagination/cursor';
import { PrismaService } from 'src/prisma/prisma.service';

import { FeedTab } from './constants/feed-tabs.constant';
import { FeedResponseDto } from './dto';
import { FeedItemsService, feedEntryInclude } from './feed-items.service';

const DEFAULT_LIMIT = 20;
const POPULAR_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

@Injectable()
export class FeedService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly feedItems: FeedItemsService,
  ) {}

  async getFeed(
    viewer: User | undefined,
    tab: FeedTab,
    cursor?: string,
    limit = DEFAULT_LIMIT,
  ): Promise<FeedResponseDto> {
    if (tab === 'following' && !viewer) {
      throw new UnauthorizedException('로그인이 필요합니다.');
    }

    // 추천 탭은 취향 정보가 없으면 최신 탭과 똑같이 동작한다
    const effectiveTab = tab === 'recommended' && !(await this.hasTaste(viewer)) ? 'latest' : tab;
    const sort = effectiveTab === 'popular' ? POPULAR_SORT : LATEST_SORT;

    const rows = await this.prisma.libraryEntry.findMany({
      where: { AND: [this.baseWhere(effectiveTab, viewer), sort.where(cursor)] },
      orderBy: sort.orderBy,
      take: limit + 1,
      include: feedEntryInclude,
    });

    const hasMore = rows.length > limit;
    const page = rows.slice(0, limit);
    const last = page[page.length - 1];

    return {
      items: await this.feedItems.toFeedItems(page, viewer?.id),
      nextCursor: hasMore && last ? sort.encode(last) : null,
    };
  }

  private baseWhere(tab: FeedTab, viewer: User | undefined): Prisma.LibraryEntryWhereInput {
    switch (tab) {
      case 'popular':
        return { isPublic: true, createdAt: { gte: new Date(Date.now() - POPULAR_WINDOW_MS) } };
      case 'following':
        return { isPublic: true, user: { followers: { some: { followerId: viewer?.id } } } };
      case 'recommended':
        return {
          isPublic: true,
          userId: { not: viewer?.id },
          OR: [
            { book: { genre: { in: viewer?.preferredGenres } } },
            { user: { followers: { some: { followerId: viewer?.id } } } },
          ],
        };
      case 'latest':
        return { isPublic: true };
    }
  }

  // 선호 장르가 있거나 팔로잉이 1명 이상이면 추천할 근거가 있는 것으로 본다
  private async hasTaste(viewer: User | undefined): Promise<boolean> {
    if (!viewer) return false;
    if (viewer.preferredGenres.length > 0) return true;

    const follow = await this.prisma.follow.findFirst({
      where: { followerId: viewer.id },
      select: { id: true },
    });
    return follow !== null;
  }
}
