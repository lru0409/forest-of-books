import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { UploadService } from './upload.service';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn().mockReturnValue({
    storage: {
      from: jest.fn().mockReturnValue({
        upload: jest.fn(),
        getPublicUrl: jest.fn(),
        list: jest.fn(),
        remove: jest.fn(),
      }),
    },
  }),
}));

jest.mock('@repo/db', () => ({
  prisma: {
    user: { findMany: jest.fn() },
  },
}));

process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

const makeFile = (overrides: Partial<Express.Multer.File> = {}): Express.Multer.File => ({
  fieldname: 'file',
  originalname: 'photo.jpg',
  encoding: '7bit',
  mimetype: 'image/jpeg',
  buffer: Buffer.from('fake-image-data'),
  size: 1024,
  stream: null as unknown as Express.Multer.File['stream'],
  destination: '',
  filename: '',
  path: '',
  ...overrides,
});

describe('UploadService', () => {
  let service: UploadService;
  let mockUpload: jest.Mock;
  let mockGetPublicUrl: jest.Mock;
  let mockList: jest.Mock;
  let mockRemove: jest.Mock;
  let mockFindMany: jest.Mock;

  beforeEach(async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createClient } = require('@supabase/supabase-js');
    const storageClient = createClient().storage.from();
    mockUpload = storageClient.upload;
    mockGetPublicUrl = storageClient.getPublicUrl;
    mockList = storageClient.list;
    mockRemove = storageClient.remove;

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    mockFindMany = require('@repo/db').prisma.user.findMany;
    const module: TestingModule = await Test.createTestingModule({
      providers: [UploadService],
    }).compile();

    service = module.get<UploadService>(UploadService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─────────────────────────────────────────────
  // uploadProfileImage
  // ─────────────────────────────────────────────
  describe('uploadProfileImage', () => {
    it('허용되지 않는 MIME 타입이면 BadRequestException', async () => {
      const file = makeFile({ mimetype: 'image/bmp' });

      await expect(service.uploadProfileImage(file)).rejects.toThrow(BadRequestException);
    });

    it('5MB 초과 파일이면 BadRequestException', async () => {
      const file = makeFile({ size: 5 * 1024 * 1024 + 1 });

      await expect(service.uploadProfileImage(file)).rejects.toThrow(BadRequestException);
    });

    it('supabase 업로드 실패 시 InternalServerErrorException', async () => {
      const file = makeFile();
      mockUpload.mockResolvedValue({ error: new Error('storage error') });

      await expect(service.uploadProfileImage(file)).rejects.toThrow(InternalServerErrorException);
    });

    it('정상 업로드: supabase publicUrl 반환', async () => {
      const file = makeFile({ originalname: 'avatar.png', mimetype: 'image/png' });
      mockUpload.mockResolvedValue({ error: null });
      mockGetPublicUrl.mockReturnValue({
        data: {
          publicUrl:
            'https://test.supabase.co/storage/v1/object/public/profile-images/uuid.png',
        },
      });

      const result = await service.uploadProfileImage(file);

      expect(mockUpload).toHaveBeenCalledWith(
        expect.stringMatching(/\.png$/),
        file.buffer,
        { contentType: 'image/png' },
      );
      expect(result).toBe(
        'https://test.supabase.co/storage/v1/object/public/profile-images/uuid.png',
      );
    });

    it.each(['image/webp', 'image/gif', 'image/jpeg'])(
      '%s 허용 MIME 타입 정상 처리',
      async (mimetype) => {
        const file = makeFile({ mimetype });
        mockUpload.mockResolvedValue({ error: null });
        mockGetPublicUrl.mockReturnValue({ data: { publicUrl: 'https://url' } });

        await expect(service.uploadProfileImage(file)).resolves.toBeDefined();
      },
    );
  });

  // ─────────────────────────────────────────────
  // cleanupOrphanProfileImageFiles
  // ─────────────────────────────────────────────
  describe('cleanupOrphanProfileImageFiles', () => {
    it('supabase list 실패 시 에러 로그 후 종료 (삭제 미실행)', async () => {
      mockList.mockResolvedValue({ data: null, error: new Error('list failed') });

      await service.cleanupOrphanProfileImageFiles();

      expect(mockRemove).not.toHaveBeenCalled();
    });

    it('스토리지 파일이 없으면 삭제 미실행', async () => {
      mockList.mockResolvedValue({ data: [], error: null });

      await service.cleanupOrphanProfileImageFiles();

      expect(mockRemove).not.toHaveBeenCalled();
    });

    it('모든 파일이 유저에게 참조되면 삭제 미실행', async () => {
      const publicUrl =
        'https://test.supabase.co/storage/v1/object/public/profile-images/used.jpg';
      const oldDate = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

      mockList.mockResolvedValue({
        data: [{ name: 'used.jpg', created_at: oldDate }],
        error: null,
      });
      mockFindMany.mockResolvedValue([{ profileImage: publicUrl }]);
      mockGetPublicUrl.mockReturnValue({ data: { publicUrl } });

      await service.cleanupOrphanProfileImageFiles();

      expect(mockRemove).not.toHaveBeenCalled();
    });

    it('grace period(24h) 이내 파일은 고아여도 삭제 안 함', async () => {
      const recentDate = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString();

      mockList.mockResolvedValue({
        data: [{ name: 'recent.jpg', created_at: recentDate }],
        error: null,
      });
      mockFindMany.mockResolvedValue([]);

      await service.cleanupOrphanProfileImageFiles();

      expect(mockRemove).not.toHaveBeenCalled();
    });

    it('grace period 초과 + 미참조 파일 → 삭제 실행', async () => {
      const oldDate = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

      mockList.mockResolvedValue({
        data: [{ name: 'orphan.jpg', created_at: oldDate }],
        error: null,
      });
      mockFindMany.mockResolvedValue([]);
      mockGetPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://test.supabase.co/orphan.jpg' },
      });
      mockRemove.mockResolvedValue({ error: null });

      await service.cleanupOrphanProfileImageFiles();

      expect(mockRemove).toHaveBeenCalledWith(['orphan.jpg']);
    });

    it('삭제 실패 시 에러 로그 후 예외 미발생', async () => {
      const oldDate = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

      mockList.mockResolvedValue({
        data: [{ name: 'orphan.jpg', created_at: oldDate }],
        error: null,
      });
      mockFindMany.mockResolvedValue([]);
      mockGetPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://test.supabase.co/orphan.jpg' },
      });
      mockRemove.mockResolvedValue({ error: new Error('delete failed') });

      await expect(service.cleanupOrphanProfileImageFiles()).resolves.not.toThrow();
    });
  });
});
