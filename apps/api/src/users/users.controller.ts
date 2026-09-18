import { Body, Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';

import { User } from '@repo/db';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

import { MeResponseDto, UpdateUserProfileDto, UserProfileResponseDto } from './dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@Req() req: Request): MeResponseDto {
    return this.usersService.getMe(req.user as User);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateMe(@Req() req: Request, @Body() dto: UpdateUserProfileDto): Promise<MeResponseDto> {
    const currentUser = req.user as User;
    return this.usersService.updateMyProfile(currentUser.id, dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<UserProfileResponseDto> {
    return this.usersService.findProfileById(id);
  }
}
