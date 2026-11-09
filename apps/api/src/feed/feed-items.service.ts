import { Injectable } from '@nestjs/common';

import type { Prisma } from '@repo/db';
import { PrismaService } from 'src/prisma/prisma.service';

import { FeedItemResponseDto } from './dto';

const NOTE_PREVIEW_LENGTH = 200;

export const feedEntryInclude = {
  user: { select: { id: true, nickname: true, profileImage: true } },
  book: true,
} satisfies Prisma.LibraryEntryInclude;

export type FeedEntry = Prisma.LibraryEntryGetPayload<{ include: typeof feedEntryInclude }>;

interface ViewerState {
  likedEntryIds: Set<string>;
  bookmarkedEntryIds: Set<string>;
  followingIds: Set<string>;
  myEntryIdByBookId: Map<string, string>;
}

@Injectable()
export class FeedItemsService {
  constructor(private readonly prisma: PrismaService) {}

  async toFeedItems(
    entries: FeedEntry[],
    viewerId: string | undefined,
  ): Promise<FeedItemResponseDto[]> {
    if (entries.length === 0) return [];

    const viewerState = viewerId
      ? await this.getViewerState(entries, viewerId)
      : emptyViewerState();

    return entries.map((entry) => ({
      entryId: entry.id,
      user: {
        id: entry.user.id,
        nickname: entry.user.nickname,
        profileImage: entry.user.profileImage,
        isFollowing: viewerState.followingIds.has(entry.userId),
      },
      book: {
        id: entry.book.id,
        title: entry.book.title,
        author: entry.book.author,
        coverUrl: entry.book.coverUrl,
        genre: entry.book.genre,
      },
      rating: entry.rating,
      comment: entry.comment,
      notePreview: toNotePreview(entry.note),
      createdAt: entry.createdAt,
      likeCount: entry.likeCount,
      viewCount: entry.viewCount,
      isLiked: viewerState.likedEntryIds.has(entry.id),
      isBookmarked: viewerState.bookmarkedEntryIds.has(entry.id),
      myLibraryEntryId: viewerState.myEntryIdByBookId.get(entry.bookId) ?? null,
    }));
  }

  private async getViewerState(entries: FeedEntry[], viewerId: string): Promise<ViewerState> {
    const entryIds = entries.map((entry) => entry.id);
    const authorIds = [...new Set(entries.map((entry) => entry.userId))];
    const bookIds = [...new Set(entries.map((entry) => entry.bookId))];

    const [likes, bookmarks, follows, myEntries] = await Promise.all([
      this.prisma.like.findMany({
        where: { userId: viewerId, entryId: { in: entryIds } },
        select: { entryId: true },
      }),
      this.prisma.bookmark.findMany({
        where: { userId: viewerId, entryId: { in: entryIds } },
        select: { entryId: true },
      }),
      this.prisma.follow.findMany({
        where: { followerId: viewerId, followingId: { in: authorIds } },
        select: { followingId: true },
      }),
      this.prisma.libraryEntry.findMany({
        where: { userId: viewerId, bookId: { in: bookIds } },
        select: { id: true, bookId: true },
      }),
    ]);

    return {
      likedEntryIds: new Set(likes.map((like) => like.entryId)),
      bookmarkedEntryIds: new Set(bookmarks.map((bookmark) => bookmark.entryId)),
      followingIds: new Set(follows.map((follow) => follow.followingId)),
      myEntryIdByBookId: new Map(myEntries.map((entry) => [entry.bookId, entry.id])),
    };
  }
}

function emptyViewerState(): ViewerState {
  return {
    likedEntryIds: new Set(),
    bookmarkedEntryIds: new Set(),
    followingIds: new Set(),
    myEntryIdByBookId: new Map(),
  };
}

function toNotePreview(note: string | null): string | null {
  if (note === null) return null;

  // 서로게이트 쌍(이모지 등)이 중간에 잘리지 않도록 코드 포인트 기준으로 자른다
  const chars = Array.from(note);
  if (chars.length <= NOTE_PREVIEW_LENGTH) return note;
  return `${chars.slice(0, NOTE_PREVIEW_LENGTH).join('')}…`;
}
