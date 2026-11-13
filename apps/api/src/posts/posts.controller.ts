import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';

import { User } from '@repo/db';
import { OptionalAuth } from 'src/auth/decorators/optional-auth.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

import { PostDetailResponseDto } from './dto';
import { PostsService } from './posts.service';

export const VIEW_RATE_LIMIT_PER_MINUTE = 20; // 조회수 엔드포인트의 요청 제한

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get(':entryId')
  @OptionalAuth()
  @UseGuards(JwtAuthGuard)
  findOne(@Param('entryId') entryId: string, @Req() req: Request): Promise<PostDetailResponseDto> {
    const viewerId = (req.user as User | undefined)?.id;
    return this.postsService.findOne(entryId, viewerId);
  }

  @Put(':entryId/like')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  like(@Param('entryId') entryId: string, @Req() req: Request): Promise<void> {
    return this.postsService.like(entryId, (req.user as User).id);
  }

  @Delete(':entryId/like')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  unlike(@Param('entryId') entryId: string, @Req() req: Request): Promise<void> {
    return this.postsService.unlike(entryId, (req.user as User).id);
  }

  @Put(':entryId/bookmark')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  bookmark(@Param('entryId') entryId: string, @Req() req: Request): Promise<void> {
    return this.postsService.bookmark(entryId, (req.user as User).id);
  }

  @Delete(':entryId/bookmark')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  unbookmark(@Param('entryId') entryId: string, @Req() req: Request): Promise<void> {
    return this.postsService.unbookmark(entryId, (req.user as User).id);
  }

  @Post(':entryId/view')
  @HttpCode(HttpStatus.NO_CONTENT)
  @OptionalAuth()
  @UseGuards(JwtAuthGuard, ThrottlerGuard)
  @Throttle({ default: { limit: VIEW_RATE_LIMIT_PER_MINUTE, ttl: 60_000 } })
  recordView(@Param('entryId') entryId: string, @Req() req: Request): Promise<void> {
    const viewerId = (req.user as User | undefined)?.id;
    return this.postsService.recordView(entryId, viewerId, req.ip ?? 'unknown');
  }
}
