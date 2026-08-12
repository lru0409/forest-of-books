import { IsString, IsOptional, IsNumberString } from 'class-validator';

export class SearchBooksDto {
  @IsString()
  query!: string;

  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;
}
