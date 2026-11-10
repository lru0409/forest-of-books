import { Module } from '@nestjs/common';

import { AuthModule } from 'src/auth/auth.module';
import { FeedModule } from 'src/feed/feed.module';

import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';

@Module({
  imports: [AuthModule, FeedModule],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}
