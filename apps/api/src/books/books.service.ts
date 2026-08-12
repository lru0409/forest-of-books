import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ALADIN_SEARCH_URL } from './lib/constants';
import type { AladinSearchResponse } from './lib/aladin-api.types';
import { SearchBookItemDto, SearchBooksResponseDto } from './dto/search-book-response.dto';

@Injectable()
export class BooksService {
  private readonly logger = new Logger(BooksService.name);

  constructor(private readonly configService: ConfigService) {}

  async search(query: string, page = 1, limit = 10): Promise<SearchBooksResponseDto> {
    const ttbKey = this.configService.get<string>('API_ALADIN_TTB_KEY');
    if (!ttbKey) {
      throw new InternalServerErrorException('도서 검색 기능을 사용할 수 없습니다.');
    }

    const params = new URLSearchParams({
      ttbkey: ttbKey,
      Query: query,
      QueryType: 'Keyword',
      SearchTarget: 'Book',
      start: String(page),
      MaxResults: String(limit),
      Version: '20131101',
      Output: 'JS',
    });

    const response = await fetch(`${ALADIN_SEARCH_URL}?${params.toString()}`);

    if (!response.ok) {
      this.logger.error(`Aladin book search failed: ${response.status}`);
      throw new InternalServerErrorException('도서 검색에 실패했습니다.');
    }

    const data = (await response.json()) as AladinSearchResponse;

    if (data.errorCode) {
      this.logger.error(`Aladin book search error: ${data.errorCode} ${data.errorMessage}`);
      throw new BadRequestException('검색어를 확인해 주세요.');
    }

    const items: SearchBookItemDto[] = (data.item ?? []).map((item) => ({
      id: item.isbn13 || `${item.title}-${item.author}`,
      title: item.title,
      author: item.author,
      publisher: item.publisher,
      isbn: item.isbn13,
      coverUrl: item.cover,
      genre: null,
    }));

    return { total: data.totalResults, items };
  }
}
