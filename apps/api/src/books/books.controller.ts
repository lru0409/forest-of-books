import { Controller, Get, Query } from '@nestjs/common';

import { BooksService } from './books.service';
import { SearchBooksDto } from './dto/search-books.dto';
import { SearchBooksResponseDto } from './dto/search-book-response.dto';

@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Get('search')
  search(@Query() { query, page, limit }: SearchBooksDto): Promise<SearchBooksResponseDto> {
    return this.booksService.search(
      query,
      page ? Number(page) : undefined,
      limit ? Number(limit) : undefined,
    );
  }
}
