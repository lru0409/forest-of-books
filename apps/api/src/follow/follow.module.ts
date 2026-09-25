import { Module } from '@nestjs/common';

import { AuthModule } from 'src/auth/auth.module';

import { FollowController, FollowListController } from './follow.controller';
import { FollowService } from './follow.service';

@Module({
  imports: [AuthModule],
  controllers: [FollowController, FollowListController],
  providers: [FollowService],
  exports: [FollowService],
})
export class FollowModule {}
