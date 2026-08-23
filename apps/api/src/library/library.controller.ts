import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { User } from '@repo/db';
import { OptionalAuth } from 'src/auth/decorators/optional-auth.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

import { CreateLibraryEntryDto } from './dto/create-library-entry.dto';
import { LibraryEntryDetailResponseDto } from './dto/library-entry-detail-response.dto';
import { LibraryEntryListItemResponseDto } from './dto/library-entry-list-item-response.dto';
import { UpdateLibraryEntryDto } from './dto/update-library-entry.dto';
import { LibraryService } from './library.service';

@Controller('users/:userId/library')
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  @Get()
  @OptionalAuth()
  @UseGuards(JwtAuthGuard)
  findByUser(
    @Param('userId') userId: string,
    @Req() req: Request,
  ): Promise<LibraryEntryListItemResponseDto[]> {
    const viewerId = (req.user as User | undefined)?.id;
    return this.libraryService.findByUser(userId, viewerId);
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
  @OptionalAuth()
  @UseGuards(JwtAuthGuard)
  findOne(
    @Param('entryId') entryId: string,
    @Req() req: Request,
  ): Promise<LibraryEntryDetailResponseDto> {
    const viewerId = (req.user as User | undefined)?.id;
    return this.libraryService.findOne(entryId, viewerId);
  }

  @Patch(':entryId')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('entryId') entryId: string,
    @Req() req: Request,
    @Body() dto: UpdateLibraryEntryDto,
  ): Promise<LibraryEntryDetailResponseDto> {
    const currentUser = req.user as User;
    return this.libraryService.update(entryId, currentUser.id, dto);
  }

  @Delete(':entryId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  remove(@Param('entryId') entryId: string, @Req() req: Request): Promise<void> {
    const currentUser = req.user as User;
    return this.libraryService.remove(entryId, currentUser.id);
  }
}
