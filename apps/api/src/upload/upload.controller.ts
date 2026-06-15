import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UploadService } from './upload.service';

@Controller('upload')
export class UploadController {
  constructor(private uploadService: UploadService) {}

  @Post('profile-image')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async uploadProfileImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('파일이 없습니다.');
    const url = await this.uploadService.uploadProfileImage(file);
    return { url };
  }
}
