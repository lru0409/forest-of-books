import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

type MockUploadService = {
  uploadProfileImage: jest.Mock;
};

const createMockUploadService = (): MockUploadService => ({
  uploadProfileImage: jest.fn(),
});

const makeFile = (overrides: Partial<Express.Multer.File> = {}): Express.Multer.File => ({
  fieldname: 'file',
  originalname: 'photo.jpg',
  encoding: '7bit',
  mimetype: 'image/jpeg',
  buffer: Buffer.from('fake'),
  size: 1024,
  stream: null as unknown as Express.Multer.File['stream'],
  destination: '',
  filename: '',
  path: '',
  ...overrides,
});

describe('UploadController', () => {
  let controller: UploadController;
  let mockUploadService: MockUploadService;

  beforeEach(async () => {
    mockUploadService = createMockUploadService();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UploadController],
      providers: [{ provide: UploadService, useValue: mockUploadService }],
    }).compile();

    controller = module.get<UploadController>(UploadController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadProfileImage', () => {
    it('파일 없으면 BadRequestException', async () => {
      await expect(
        controller.uploadProfileImage(undefined as unknown as Express.Multer.File),
      ).rejects.toThrow(BadRequestException);

      expect(mockUploadService.uploadProfileImage).not.toHaveBeenCalled();
    });

    it('정상 업로드: { url } 반환', async () => {
      const file = makeFile();
      mockUploadService.uploadProfileImage.mockResolvedValue('https://cdn.example.com/img.jpg');

      const result = await controller.uploadProfileImage(file);

      expect(mockUploadService.uploadProfileImage).toHaveBeenCalledWith(file);
      expect(result).toEqual({ url: 'https://cdn.example.com/img.jpg' });
    });

    it('service가 BadRequestException throw 시 그대로 전파', async () => {
      const file = makeFile();
      mockUploadService.uploadProfileImage.mockRejectedValue(
        new BadRequestException('JPG, PNG, WEBP, GIF 파일만 업로드 가능합니다.'),
      );

      await expect(controller.uploadProfileImage(file)).rejects.toThrow(BadRequestException);
    });

    it('service가 InternalServerErrorException throw 시 그대로 전파', async () => {
      const file = makeFile();
      mockUploadService.uploadProfileImage.mockRejectedValue(
        new InternalServerErrorException('파일 업로드에 실패했습니다.'),
      );

      await expect(controller.uploadProfileImage(file)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
