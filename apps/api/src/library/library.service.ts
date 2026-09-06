import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { Book, LibraryEntry } from '@repo/db';
import { PrismaService } from 'src/prisma/prisma.service';

import {
  CreateLibraryEntryDto,
  LibraryEntryDetailResponseDto,
  LibraryEntryListItemResponseDto,
  UpdateLibraryEntryDto,
} from './dto';

@Injectable()
export class LibraryService {
  constructor(private readonly prisma: PrismaService) {}

  async findByUser(userId: string, viewerId?: string): Promise<LibraryEntryListItemResponseDto[]> {
    const isOwner = viewerId === userId;

    const entries = await this.prisma.libraryEntry.findMany({
      where: { userId, ...(!isOwner && { isPublic: true }) },
      include: { book: true },
      orderBy: { createdAt: 'desc' },
    });

    return entries.map(toListItemDto);
  }

  async findOne(entryId: string, viewerId?: string): Promise<LibraryEntryDetailResponseDto> {
    const entry = await this.prisma.libraryEntry.findUnique({
      where: { id: entryId },
      include: { book: true },
    });
    if (!entry) throw new NotFoundException('서재 항목을 찾을 수 없습니다.');
    const isOwner = viewerId === entry.userId;
    if (!entry.isPublic && !isOwner) {
      throw new NotFoundException('서재 항목을 찾을 수 없습니다.');
    }

    return toDetailDto(entry);
  }

  async create(userId: string, dto: CreateLibraryEntryDto): Promise<LibraryEntryDetailResponseDto> {
    const book = dto.book.isbn
      ? await this.prisma.book.upsert({
          where: { isbn: dto.book.isbn },
          update: {},
          create: { ...dto.book },
        })
      : await this.prisma.book.create({ data: { ...dto.book } });

    try {
      const entry = await this.prisma.libraryEntry.create({
        data: {
          userId,
          bookId: book.id,
          color: dto.note.color,
          ...(dto.note.status !== undefined && { status: dto.note.status }),
          ...(dto.note.isPublic !== undefined && { isPublic: dto.note.isPublic }),
          ...(dto.note.rating !== undefined && { rating: dto.note.rating }),
          ...(dto.note.comment !== undefined && { comment: dto.note.comment }),
          ...(dto.note.note !== undefined && { note: dto.note.note }),
        },
        include: { book: true },
      });

      return toDetailDto(entry);
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'P2002') {
        throw new ConflictException('이미 서재에 추가된 책입니다.');
      }
      throw error;
    }
  }

  async update(
    entryId: string,
    currentUserId: string,
    dto: UpdateLibraryEntryDto,
  ): Promise<LibraryEntryDetailResponseDto> {
    await this.ensureCanEdit(entryId, currentUserId);

    const entry = await this.prisma.libraryEntry.update({
      where: { id: entryId },
      data: {
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.color !== undefined && { color: dto.color }),
        ...(dto.isPublic !== undefined && { isPublic: dto.isPublic }),
        ...(dto.rating !== undefined && { rating: dto.rating }),
        ...(dto.comment !== undefined && { comment: dto.comment }),
        ...(dto.note !== undefined && { note: dto.note }),
      },
      include: { book: true },
    });

    return toDetailDto(entry);
  }

  async remove(entryId: string, currentUserId: string): Promise<void> {
    await this.ensureCanEdit(entryId, currentUserId);

    await this.prisma.libraryEntry.delete({ where: { id: entryId } });
  }

  private async ensureCanEdit(entryId: string, currentUserId: string): Promise<void> {
    const entry = await this.prisma.libraryEntry.findUnique({ where: { id: entryId } });
    if (!entry) throw new NotFoundException('서재 항목을 찾을 수 없습니다.');
    if (entry.userId === currentUserId) return;

    if (entry.isPublic) {
      throw new ForbiddenException('본인 서재 항목만 수정할 수 있습니다.');
    }
    throw new NotFoundException('서재 항목을 찾을 수 없습니다.');
  }
}

function toListItemDto(entry: LibraryEntry & { book: Book }): LibraryEntryListItemResponseDto {
  return {
    id: entry.id,
    title: entry.book.title,
    author: entry.book.author,
    genre: entry.book.genre,
    coverUrl: entry.book.coverUrl,
    status: entry.status,
    color: entry.color,
    isPublic: entry.isPublic,
  };
}

function toDetailDto(entry: LibraryEntry & { book: Book }): LibraryEntryDetailResponseDto {
  return {
    ...toListItemDto(entry),
    publisher: entry.book.publisher,
    rating: entry.rating,
    comment: entry.comment,
    note: entry.note,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  };
}
