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
}
