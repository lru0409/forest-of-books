import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

import { Genre, ReadingStatus } from '@repo/db';

import { BOOK_COLORS } from '../constants/book-colors.constant';

export class CreateLibraryEntryBookDto {
  @IsString()
  title!: string;

  @IsString()
  author!: string;

  @IsEnum(Genre)
  genre!: Genre;

  @IsOptional()
  @IsString()
  publisher?: string;

  @IsOptional()
  @IsString()
  coverUrl?: string;

  @IsOptional()
  @IsString()
  isbn?: string;
}

export class CreateLibraryEntryNoteDto {
  @IsOptional()
  @IsEnum(ReadingStatus)
  status?: ReadingStatus;

  @IsIn(BOOK_COLORS)
  color!: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  comment?: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class CreateLibraryEntryDto {
  @ValidateNested()
  @Type(() => CreateLibraryEntryBookDto)
  book!: CreateLibraryEntryBookDto;

  @ValidateNested()
  @Type(() => CreateLibraryEntryNoteDto)
  note!: CreateLibraryEntryNoteDto;
}
