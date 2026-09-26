import { Body, Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';

import { User } from '@repo/db';
import { OptionalAuth } from 'src/auth/decorators/optional-auth.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

import { MeResponseDto, UpdateUserProfileDto, UserProfileResponseDto } from './dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@Req() req: Request): Promise<MeResponseDto> {
    return this.usersService.getMe(req.user as User);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateMe(@Req() req: Request, @Body() dto: UpdateUserProfileDto): Promise<MeResponseDto> {
    const currentUser = req.user as User;
    return this.usersService.updateMyProfile(currentUser.id, dto);
  }

  @Get(':id')
  @OptionalAuth()
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string, @Req() req: Request): Promise<UserProfileResponseDto> {
    const viewerId = (req.user as User | undefined)?.id;
    return this.usersService.findProfileById(id, viewerId);
  }
}
