import { Module } from '@nestjs/common';

import { AuthModule } from 'src/auth/auth.module';

import { LibraryController, LibraryEntryController } from './library.controller';
import { LibraryService } from './library.service';

@Module({
  imports: [AuthModule],
  controllers: [LibraryController, LibraryEntryController],
  providers: [LibraryService],
})
export class LibraryModule {}
