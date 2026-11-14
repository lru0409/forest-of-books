import { Injectable } from '@nestjs/common';

import { LATEST_SORT } from 'src/common/pagination/cursor';
import { FeedItemsService, feedEntryInclude } from 'src/feed/feed-items.service';
import { PrismaService } from 'src/prisma/prisma.service';

import { BookmarkItemResponseDto, BookmarkListResponseDto } from './dto';

const DEFAULT_LIMIT = 20;

@Injectable()
export class BookmarksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly feedItems: FeedItemsService,
  ) {}

  async findMine(
    userId: string,
    cursor?: string,
    limit = DEFAULT_LIMIT,
  ): Promise<BookmarkListResponseDto> {
    const rows = await this.prisma.bookmark.findMany({
      where: { userId, ...LATEST_SORT.where(cursor) },
      orderBy: LATEST_SORT.orderBy,
      take: limit + 1,
      include: { entry: { include: feedEntryInclude } },
    });

    const hasMore = rows.length > limit;
    const page = rows.slice(0, limit);

    // 공개 노트이거나 내 노트면 내용을 보여주고, 그 외(작성자가 비공개로 전환)는 자리표시만 남긴다
    const available = page.filter((row) => row.entry.isPublic || row.entry.userId === userId);
    const feedItems = await this.feedItems.toFeedItems(
      available.map((row) => row.entry),
      userId,
    );
    const postByEntryId = new Map(feedItems.map((item) => [item.entryId, item]));

    const items: BookmarkItemResponseDto[] = page.map((row) => {
      const post = postByEntryId.get(row.entryId) ?? null;
      return {
        bookmarkId: row.id,
        entryId: row.entryId,
        createdAt: row.createdAt,
        isAvailable: post !== null,
        post,
      };
    });

    const last = page[page.length - 1];
    return {
      items,
      nextCursor:
        hasMore && last ? LATEST_SORT.encode({ createdAt: last.createdAt, id: last.id }) : null,
    };
  }
}
