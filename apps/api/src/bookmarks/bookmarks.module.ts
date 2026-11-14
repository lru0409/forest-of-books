import { Module } from '@nestjs/common';

import { AuthModule } from 'src/auth/auth.module';
import { FeedModule } from 'src/feed/feed.module';

import { BookmarksController } from './bookmarks.controller';
import { BookmarksService } from './bookmarks.service';

@Module({
  imports: [AuthModule, FeedModule],
  controllers: [BookmarksController],
  providers: [BookmarksService],
})
export class BookmarksModule {}
