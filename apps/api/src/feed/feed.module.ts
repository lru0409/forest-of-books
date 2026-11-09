import { Module } from '@nestjs/common';

import { AuthModule } from 'src/auth/auth.module';

import { FeedController } from './feed.controller';
import { FeedItemsService } from './feed-items.service';
import { FeedService } from './feed.service';

@Module({
  imports: [AuthModule],
  controllers: [FeedController],
  providers: [FeedService, FeedItemsService],
  exports: [FeedItemsService],
})
export class FeedModule {}
