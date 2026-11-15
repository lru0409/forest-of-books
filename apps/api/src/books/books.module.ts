import { Module } from '@nestjs/common';

import { AuthModule } from 'src/auth/auth.module';
import { FeedModule } from 'src/feed/feed.module';

import { BooksController } from './books.controller';
import { BooksService } from './books.service';

@Module({
  imports: [AuthModule, FeedModule],
  controllers: [BooksController],
  providers: [BooksService],
})
export class BooksModule {}
