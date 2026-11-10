import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';

import { User } from '@repo/db';
import { OptionalAuth } from 'src/auth/decorators/optional-auth.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

import { PostDetailResponseDto } from './dto';
import { PostsService } from './posts.service';

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
}
