import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';

import { User } from '@repo/db';
import { OptionalAuth } from 'src/auth/decorators/optional-auth.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

import { CommunityService } from './community.service';
import { CommunityBookResponseDto, CommunityListQueryDto, CommunityUserResponseDto } from './dto';

@Controller('community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Get('popular-books')
  getPopularBooks(@Query() query: CommunityListQueryDto): Promise<CommunityBookResponseDto[]> {
    return this.communityService.getPopularBooks(query.limit);
  }

  @Get('users')
  @OptionalAuth()
  @UseGuards(JwtAuthGuard)
  getUsers(
    @Query() query: CommunityListQueryDto,
    @Req() req: Request,
  ): Promise<CommunityUserResponseDto[]> {
    const viewerId = (req.user as User | undefined)?.id;
    return this.communityService.getUsers(viewerId, query.limit);
  }
}
