import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UploadModule } from './upload/upload.module';
import { BooksModule } from './books/books.module';
import { LibraryModule } from './library/library.module';
import { UsersModule } from './users/users.module';
import { FollowModule } from './follow/follow.module';
import { FeedModule } from './feed/feed.module';
import { PostsModule } from './posts/posts.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    // 전역 가드는 걸지 않는다. 조회수/신고/댓글 등 필요한 엔드포인트에만 ThrottlerGuard를 적용한다.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    PrismaModule,
    AuthModule,
    UploadModule,
    BooksModule,
    LibraryModule,
    UsersModule,
    FollowModule,
    FeedModule,
    PostsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
