import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { extname } from 'path';

const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// TODO: 고아 파일 정리 로직 구현

@Injectable()
export class UploadService {
  private supabase = createClient(
    process.env.SUPABASE_URL ??
      (() => {
        throw new Error('SUPABASE_URL is not set');
      })(),
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
      (() => {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
      })(),
  );

  async uploadProfileImage(file: Express.Multer.File): Promise<string> {
    if (!ALLOWED_FILE_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('JPG, PNG, WEBP, GIF 파일만 업로드 가능합니다.');
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('파일 크기는 5MB 이하여야 합니다.');
    }

    const ext = extname(file.originalname);
    const filename = `${randomUUID()}${ext}`;

    const { error } = await this.supabase.storage
      .from('profile-images')
      .upload(filename, file.buffer, { contentType: file.mimetype });
    if (error) throw new InternalServerErrorException('파일 업로드에 실패했습니다.');

    const { data } = this.supabase.storage.from('profile-images').getPublicUrl(filename);
    return data.publicUrl;
  }
}
