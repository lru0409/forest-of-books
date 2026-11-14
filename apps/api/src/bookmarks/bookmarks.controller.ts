import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';

import { User } from '@repo/db';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CursorPaginationQueryDto } from 'src/common/pagination/cursor-pagination-query.dto';

import { BookmarkListResponseDto } from './dto';
import { BookmarksService } from './bookmarks.service';

@Controller('users/me/bookmarks')
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  findMine(
    @Query() query: CursorPaginationQueryDto,
    @Req() req: Request,
  ): Promise<BookmarkListResponseDto> {
    return this.bookmarksService.findMine((req.user as User).id, query.cursor, query.limit);
  }
}
