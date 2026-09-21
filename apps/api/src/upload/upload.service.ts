import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { prisma } from '@repo/db';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { extname } from 'path';

const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ORPHAN_GRACE_PERIOD_MS = 24 * 60 * 60 * 1000; // 24 hours
const PROFILE_IMAGES_BUCKET = 'profile-images';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

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
      .from(PROFILE_IMAGES_BUCKET)
      .upload(filename, file.buffer, { contentType: file.mimetype });
    if (error) throw new InternalServerErrorException('파일 업로드에 실패했습니다.');

    const { data } = this.supabase.storage.from(PROFILE_IMAGES_BUCKET).getPublicUrl(filename);
    return data.publicUrl;
  }

  @Cron('0 0 * * *')
  async cleanupOrphanProfileImageFiles(): Promise<void> {
    this.logger.log('고아 프로필 이미지 파일 정리 시작');

    const { data: storageFiles, error } = await this.supabase.storage
      .from(PROFILE_IMAGES_BUCKET)
      .list();
    if (error) {
      this.logger.error('스토리지 파일 목록 조회 실패', error.message);
      return;
    }
    if (!storageFiles?.length) return;

    const users = await prisma.user.findMany({ select: { profileImage: true } });
    const referencedUrls = new Set(users.map((u) => u.profileImage));

    const now = Date.now();
    const orphans = storageFiles.filter((file) => {
      const createdAt = file.created_at ? new Date(file.created_at).getTime() : 0;
      // 생성된지 ORPHAN_GRACE_PERIOD_MS 미만인 경우 고아 파일로 간주하지 않음
      if (now - createdAt < ORPHAN_GRACE_PERIOD_MS) return false;
      const { data } = this.supabase.storage.from(PROFILE_IMAGES_BUCKET).getPublicUrl(file.name);
      return !referencedUrls.has(data.publicUrl);
    });

    if (!orphans.length) {
      this.logger.log('삭제할 고아 파일 없음');
      return;
    }

    const { error: deleteError } = await this.supabase.storage
      .from(PROFILE_IMAGES_BUCKET)
      .remove(orphans.map((f) => f.name));

    if (deleteError) {
      this.logger.error('고아 파일 삭제 실패', deleteError.message);
    } else {
      this.logger.log(`고아 파일 ${orphans.length}개 삭제 완료`);
    }
  }
}
