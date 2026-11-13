import { createHash } from 'node:crypto';

import { Injectable, NotFoundException } from '@nestjs/common';

import { FeedItemsService, feedEntryInclude } from 'src/feed/feed-items.service';
import { PrismaService } from 'src/prisma/prisma.service';

import { PostDetailResponseDto } from './dto';

@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly feedItems: FeedItemsService,
  ) {}

  async findOne(entryId: string, viewerId?: string): Promise<PostDetailResponseDto> {
    const entry = await this.prisma.libraryEntry.findUnique({
      where: { id: entryId },
      include: feedEntryInclude,
    });
    // 비공개 노트는 작성자 외에게 존재 자체를 숨긴다
    if (!entry || (!entry.isPublic && entry.userId !== viewerId)) {
      throw new NotFoundException('노트를 찾을 수 없습니다.');
    }

    const [item] = await this.feedItems.toFeedItems([entry], viewerId);
    if (!item) throw new NotFoundException('노트를 찾을 수 없습니다.');

    return { ...item, note: entry.note };
  }

  async like(entryId: string, userId: string): Promise<void> {
    await this.ensurePublic(entryId);

    await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.like.createMany({
        data: [{ userId, entryId }],
        skipDuplicates: true,
      });
      if (count > 0) {
        await tx.libraryEntry.update({
          where: { id: entryId },
          data: { likeCount: { increment: 1 } },
        });
      }
    });
  }

  async unlike(entryId: string, userId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.like.deleteMany({ where: { userId, entryId } });
      if (count > 0) {
        await tx.libraryEntry.update({
          where: { id: entryId },
          data: { likeCount: { decrement: 1 } },
        });
      }
    });
  }

  async bookmark(entryId: string, userId: string): Promise<void> {
    await this.ensurePublic(entryId);

    await this.prisma.bookmark.createMany({
      data: [{ userId, entryId }],
      skipDuplicates: true,
    });
  }

  async unbookmark(entryId: string, userId: string): Promise<void> {
    await this.prisma.bookmark.deleteMany({ where: { userId, entryId } });
  }

  async recordView(entryId: string, viewerId: string | undefined, ip: string): Promise<void> {
    const entry = await this.prisma.libraryEntry.findUnique({
      where: { id: entryId },
      select: { id: true, userId: true, isPublic: true },
    });
    if (!entry) throw new NotFoundException('노트를 찾을 수 없습니다.');
    if (entry.userId === viewerId) return; // 작성자 본인의 조회는 세지 않는다.
    if (!entry.isPublic) throw new NotFoundException('노트를 찾을 수 없습니다.');

    const viewerKey = viewerId ? `user:${viewerId}` : `ip:${this.hashIp(ip)}`; // 같은 조회자(유저 또는 IP)는 하루에 한 번만 센다.
    const day = this.toUtcDate(new Date());

    await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.entryView.createMany({
        data: [{ entryId, viewerKey, day }],
        skipDuplicates: true,
      });
      if (count > 0) {
        await tx.libraryEntry.update({
          where: { id: entryId },
          data: { viewCount: { increment: 1 } },
        });
      }
    });
  }

  private async ensurePublic(entryId: string): Promise<void> {
    const entry = await this.prisma.libraryEntry.findUnique({
      where: { id: entryId },
      select: { isPublic: true },
    });
    if (!entry?.isPublic) throw new NotFoundException('노트를 찾을 수 없습니다.');
  }

  // IP 원문은 저장하지 않는다
  private hashIp(ip: string): string {
    return createHash('sha256').update(ip).digest('hex');
  }

  // @db.Date 컬럼에 넣을 UTC 기준 날짜 (시각 부분은 0)
  private toUtcDate(date: Date): Date {
    return new Date(date.toISOString().slice(0, 10));
  }
}
