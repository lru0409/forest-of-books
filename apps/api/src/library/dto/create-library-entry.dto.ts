import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

import { Genre, ReadingStatus } from '@repo/db';

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

  @IsOptional()
  @IsString()
  color?: string;

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

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateLibraryEntryNoteDto)
  note?: CreateLibraryEntryNoteDto;
}
