import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

import { FEED_TABS, FeedTab } from '../constants/feed-tabs.constant';

export class FeedQueryDto {
  @IsOptional()
  @IsIn(FEED_TABS)
  tab?: FeedTab;

  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}
