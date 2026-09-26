import { Module } from '@nestjs/common';

import { AuthModule } from 'src/auth/auth.module';
import { FollowModule } from 'src/follow/follow.module';

import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [AuthModule, FollowModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
