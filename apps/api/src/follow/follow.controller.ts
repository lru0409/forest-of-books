import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { User } from '@repo/db';
import { OptionalAuth } from 'src/auth/decorators/optional-auth.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

import { FollowListQueryDto, FollowListResponseDto } from './dto';
import { FollowService } from './follow.service';

@Controller('users/:userId/follow')
export class FollowController {
  constructor(private readonly followService: FollowService) {}

  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  follow(@Param('userId') followingId: string, @Req() req: Request): Promise<void> {
    const follower = req.user as User;
    return this.followService.follow(follower.id, followingId);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  unfollow(@Param('userId') followingId: string, @Req() req: Request): Promise<void> {
    const follower = req.user as User;
    return this.followService.unfollow(follower.id, followingId);
  }
}

@Controller('users/:userId')
export class FollowListController {
  constructor(private readonly followService: FollowService) {}

  @Get('followers')
  @OptionalAuth()
  @UseGuards(JwtAuthGuard)
  getFollowers(
    @Param('userId') userId: string,
    @Query() query: FollowListQueryDto,
    @Req() req: Request,
  ): Promise<FollowListResponseDto> {
    const viewerId = (req.user as User | undefined)?.id;
    return this.followService.getFollowers(
      userId,
      viewerId,
      query.cursor,
      query.limit ? Number(query.limit) : undefined,
    );
  }

  @Get('following')
  @OptionalAuth()
  @UseGuards(JwtAuthGuard)
  getFollowing(
    @Param('userId') userId: string,
    @Query() query: FollowListQueryDto,
    @Req() req: Request,
  ): Promise<FollowListResponseDto> {
    const viewerId = (req.user as User | undefined)?.id;
    return this.followService.getFollowing(
      userId,
      viewerId,
      query.cursor,
      query.limit ? Number(query.limit) : undefined,
    );
  }
}
