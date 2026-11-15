import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { LATEST_SORT } from 'src/common/pagination/cursor';
import { FeedResponseDto } from 'src/feed/dto';
import { FeedItemsService, feedEntryInclude } from 'src/feed/feed-items.service';
import { PrismaService } from 'src/prisma/prisma.service';

import { ALADIN_SEARCH_URL } from './lib/constants';
import type { AladinSearchResponse } from './lib/aladin-api.types';
import { mapAladinCategoryToGenre } from './lib/map-aladin-category-to-genre';
import { BookDetailResponseDto } from './dto/book-detail-response.dto';
import { SearchBookItemDto, SearchBooksResponseDto } from './dto/search-book-response.dto';

const DEFAULT_NOTES_LIMIT = 20;

@Injectable()
export class BooksService {
  private readonly logger = new Logger(BooksService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly feedItemsService: FeedItemsService,
  ) {}

  async search(query: string, page = 1, limit = 10): Promise<SearchBooksResponseDto> {
    const ttbKey = this.configService.get<string>('API_ALADIN_TTB_KEY');
    if (!ttbKey) {
      throw new InternalServerErrorException('도서 검색 기능을 사용할 수 없습니다.');
    }

    const params = new URLSearchParams({
      ttbkey: ttbKey,
      Query: query,
      QueryType: 'Keyword',
      SearchTarget: 'Book',
      start: String(page),
      MaxResults: String(limit),
      Version: '20131101',
      Output: 'JS',
    });

    const response = await fetch(`${ALADIN_SEARCH_URL}?${params.toString()}`);

    if (!response.ok) {
      this.logger.error(`Aladin book search failed: ${response.status}`);
      throw new InternalServerErrorException('도서 검색에 실패했습니다.');
    }

    const data = (await response.json()) as AladinSearchResponse;

    if (data.errorCode) {
      this.logger.error(`Aladin book search error: ${data.errorCode} ${data.errorMessage}`);
      throw new BadRequestException('검색어를 확인해 주세요.');
    }

    const items: SearchBookItemDto[] = (data.item ?? []).map((item) => ({
      id: String(item.itemId),
      title: item.title,
      author: item.author,
      publisher: item.publisher,
      isbn: item.isbn13,
      coverUrl: item.cover,
      genre: item.categoryName ? mapAladinCategoryToGenre(item.categoryName) : 'OTHER',
    }));

    return { total: data.totalResults, items };
  }

  async findOne(bookId: string, viewerId?: string): Promise<BookDetailResponseDto> {
    const book = await this.prisma.book.findUnique({ where: { id: bookId } });
    if (!book) throw new NotFoundException('책을 찾을 수 없습니다.');

    const publicWhere = { bookId, isPublic: true };
    const [publicNoteCount, ratingStats, readingCount, completedCount, myEntry] = await Promise.all(
      [
        this.prisma.libraryEntry.count({ where: publicWhere }),
        this.prisma.libraryEntry.aggregate({
          where: { ...publicWhere, rating: { not: null } },
          _avg: { rating: true },
        }),
        this.prisma.libraryEntry.count({ where: { bookId, status: 'READING' } }),
        this.prisma.libraryEntry.count({ where: { bookId, status: 'COMPLETED' } }),
        viewerId
          ? this.prisma.libraryEntry.findUnique({
              where: { userId_bookId: { userId: viewerId, bookId } },
              select: { id: true },
            })
          : null,
      ],
    );

    const average = ratingStats._avg.rating;
    return {
      id: book.id,
      title: book.title,
      author: book.author,
      genre: book.genre,
      publisher: book.publisher,
      coverUrl: book.coverUrl,
      publicNoteCount,
      averageRating: average === null ? null : Math.round(average * 10) / 10,
      readingCount,
      completedCount,
      myLibraryEntryId: myEntry?.id ?? null,
    };
  }

  async findNotes(
    bookId: string,
    viewerId: string | undefined,
    cursor?: string,
    limit = DEFAULT_NOTES_LIMIT,
  ): Promise<FeedResponseDto> {
    const book = await this.prisma.book.findUnique({ where: { id: bookId }, select: { id: true } });
    if (!book) throw new NotFoundException('책을 찾을 수 없습니다.');

    const rows = await this.prisma.libraryEntry.findMany({
      where: { bookId, isPublic: true, ...LATEST_SORT.where(cursor) },
      orderBy: LATEST_SORT.orderBy,
      take: limit + 1,
      include: feedEntryInclude,
    });

    const hasMore = rows.length > limit;
    const page = rows.slice(0, limit);
    const last = page[page.length - 1];

    return {
      items: await this.feedItemsService.toFeedItems(page, viewerId),
      nextCursor:
        hasMore && last ? LATEST_SORT.encode({ createdAt: last.createdAt, id: last.id }) : null,
    };
  }
}
