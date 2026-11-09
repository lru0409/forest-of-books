import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';

import { User } from '@repo/db';
import { OptionalAuth } from 'src/auth/decorators/optional-auth.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

import { FeedQueryDto, FeedResponseDto } from './dto';
import { FeedService } from './feed.service';

@Controller('feed')
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get()
  @OptionalAuth()
  @UseGuards(JwtAuthGuard)
  getFeed(@Query() query: FeedQueryDto, @Req() req: Request): Promise<FeedResponseDto> {
    const viewer = req.user as User | undefined;
    return this.feedService.getFeed(viewer, query.tab ?? 'recommended', query.cursor, query.limit);
  }
}
