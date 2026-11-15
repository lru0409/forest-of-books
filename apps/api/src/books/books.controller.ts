import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';

import { User } from '@repo/db';
import { OptionalAuth } from 'src/auth/decorators/optional-auth.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CursorPaginationQueryDto } from 'src/common/pagination/cursor-pagination-query.dto';
import { FeedResponseDto } from 'src/feed/dto';

import { BooksService } from './books.service';
import { BookDetailResponseDto } from './dto/book-detail-response.dto';
import { SearchBooksDto } from './dto/search-books.dto';
import { SearchBooksResponseDto } from './dto/search-book-response.dto';

@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Get('search')
  search(@Query() { query, page, limit }: SearchBooksDto): Promise<SearchBooksResponseDto> {
    return this.booksService.search(query, page, limit);
  }

  @Get(':id')
  @OptionalAuth()
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string, @Req() req: Request): Promise<BookDetailResponseDto> {
    const viewerId = (req.user as User | undefined)?.id;
    return this.booksService.findOne(id, viewerId);
  }

  @Get(':id/notes')
  @OptionalAuth()
  @UseGuards(JwtAuthGuard)
  findNotes(
    @Param('id') id: string,
    @Query() query: CursorPaginationQueryDto,
    @Req() req: Request,
  ): Promise<FeedResponseDto> {
    const viewerId = (req.user as User | undefined)?.id;
    return this.booksService.findNotes(id, viewerId, query.cursor, query.limit);
  }
}
