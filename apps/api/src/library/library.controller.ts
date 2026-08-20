import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';

import { User } from '@repo/db';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

import { CreateLibraryEntryDto } from './dto/create-library-entry.dto';
import { LibraryEntryDetailResponseDto } from './dto/library-entry-detail-response.dto';
import { LibraryEntryListItemResponseDto } from './dto/library-entry-list-item-response.dto';
import { LibraryService } from './library.service';

@Controller('users/:userId/library')
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  @Get()
  findByUser(@Param('userId') userId: string): Promise<LibraryEntryListItemResponseDto[]> {
    return this.libraryService.findByUser(userId);
  }
}

@Controller('library')
export class LibraryEntryController {
  constructor(private readonly libraryService: LibraryService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Req() req: Request,
    @Body() dto: CreateLibraryEntryDto,
  ): Promise<LibraryEntryDetailResponseDto> {
    const currentUser = req.user as User;
    return this.libraryService.create(currentUser.id, dto);
  }

  @Get(':entryId')
  findOne(@Param('entryId') entryId: string): Promise<LibraryEntryDetailResponseDto> {
    return this.libraryService.findOne(entryId);
  }
}
