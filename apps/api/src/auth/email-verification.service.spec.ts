import {
  BadRequestException,
  ConflictException,
  GoneException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';

import { EmailVerificationService } from './email-verification.service';
import { PrismaService } from 'src/prisma/prisma.service';

// nodemailer는 sendVerificationEmail 내부에서 직접 생성되므로 DI로 주입 불가, 모듈 전체를 mock
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({}),
  }),
}));

// 테스트에서 반복 사용할 기본 인증 코드 객체
const makeCode = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  email: 'test@example.com',
  codeHash: '',
  attemptCount: 0,
  expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10분 후 (유효)
  verifiedAt: null,
  consumedAt: null,
  createdAt: new Date(),
  ...overrides,
});

// PrismaService mock 타입: 각 메서드가 jest.Mock임을 명시
type MockPrismaService = {
  user: { findUnique: jest.Mock };
  emailVerificationCode: {
    findFirst: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    updateMany: jest.Mock;
  };
};

const createMockPrisma = (): MockPrismaService => ({
  user: { findUnique: jest.fn() },
  emailVerificationCode: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
});

describe('EmailVerificationService', () => {
  let service: EmailVerificationService;
  let mockPrisma: MockPrismaService;

  beforeEach(async () => {
    mockPrisma = createMockPrisma();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailVerificationService,
        { provide: PrismaService, useValue: mockPrisma },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, string> = {
                API_SMTP_HOST: 'smtp.test.com',
                API_SMTP_PORT: '587',
                API_SMTP_USER: 'user@test.com',
                API_SMTP_PASS: 'password',
                API_EMAIL_FROM: 'noreply@test.com',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<EmailVerificationService>(EmailVerificationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─────────────────────────────────────────────
  // sendCode
  // ─────────────────────────────────────────────
  describe('sendCode', () => {
    it('이미 가입된 이메일이면 ConflictException', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: '1' });

      await expect(service.sendCode('test@example.com')).rejects.toThrow(ConflictException);

      expect(mockPrisma.emailVerificationCode.create).not.toHaveBeenCalled();
    });

    it('정상 케이스: 이전 코드 무효화 → 새 코드 생성 → 이메일 발송', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.emailVerificationCode.create.mockResolvedValue(makeCode());

      await service.sendCode('test@example.com');

      expect(mockPrisma.emailVerificationCode.updateMany).toHaveBeenCalledWith({
        where: { email: 'test@example.com', consumedAt: null },
        data: { consumedAt: expect.any(Date) },
      });
      expect(mockPrisma.emailVerificationCode.create).toHaveBeenCalledTimes(1);
    });

    it('이메일 대소문자·공백 정규화 후 조회', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.emailVerificationCode.create.mockResolvedValue(makeCode());

      await service.sendCode('  TEST@Example.COM  ');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('이메일 발송 실패 시 생성한 코드를 소비 처리 후 InternalServerErrorException', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.emailVerificationCode.create.mockResolvedValue(makeCode({ id: 42 }));

      const nodemailer = jest.requireMock('nodemailer');
      nodemailer.createTransport.mockReturnValueOnce({
        sendMail: jest.fn().mockRejectedValue(new Error('SMTP error')),
      });

      await expect(service.sendCode('test@example.com')).rejects.toThrow(
        InternalServerErrorException,
      );

      expect(mockPrisma.emailVerificationCode.update).toHaveBeenCalledWith({
        where: { id: 42 },
        data: { consumedAt: expect.any(Date) },
      });
    });
  });

  // ─────────────────────────────────────────────
  // verifyCode
  // ─────────────────────────────────────────────
  describe('verifyCode', () => {
    it('미소비·미인증 코드가 없으면 BadRequestException', async () => {
      mockPrisma.emailVerificationCode.findFirst.mockResolvedValue(null);

      await expect(service.verifyCode('test@example.com', '123456')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('만료된 코드면 GoneException + 해당 코드 소비 처리', async () => {
      mockPrisma.emailVerificationCode.findFirst.mockResolvedValue(
        makeCode({ expiresAt: new Date(Date.now() - 1000) }),
      );

      await expect(service.verifyCode('test@example.com', '123456')).rejects.toThrow(GoneException);

      expect(mockPrisma.emailVerificationCode.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { consumedAt: expect.any(Date) },
      });
    });

    it('코드 불일치 시 BadRequestException + attemptCount 1 증가', async () => {
      const hashedCode = await bcrypt.hash('123456', 10);
      mockPrisma.emailVerificationCode.findFirst.mockResolvedValue(
        makeCode({ codeHash: hashedCode, attemptCount: 2 }),
      );

      await expect(service.verifyCode('test@example.com', '000000')).rejects.toThrow(
        BadRequestException,
      );

      expect(mockPrisma.emailVerificationCode.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { attemptCount: 3 },
      });
    });

    it('5회 시도 도달 시 코드도 함께 소비 처리', async () => {
      const hashedCode = await bcrypt.hash('123456', 10);
      mockPrisma.emailVerificationCode.findFirst.mockResolvedValue(
        makeCode({ codeHash: hashedCode, attemptCount: 4 }),
      );

      await expect(service.verifyCode('test@example.com', '000000')).rejects.toThrow(
        BadRequestException,
      );

      expect(mockPrisma.emailVerificationCode.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { attemptCount: 5, consumedAt: expect.any(Date) },
      });
    });

    it('코드 일치 시 verifiedAt 설정', async () => {
      const validCode = '123456';
      const hashedCode = await bcrypt.hash(validCode, 10);
      mockPrisma.emailVerificationCode.findFirst.mockResolvedValue(
        makeCode({ codeHash: hashedCode }),
      );

      await service.verifyCode('test@example.com', validCode);

      expect(mockPrisma.emailVerificationCode.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { verifiedAt: expect.any(Date) },
      });
    });
  });

  // ─────────────────────────────────────────────
  // findValidVerifiedCode
  // ─────────────────────────────────────────────
  describe('findValidVerifiedCode', () => {
    it('verified + 미소비 + 미만료 코드 반환', async () => {
      const code = makeCode({ verifiedAt: new Date() });
      mockPrisma.emailVerificationCode.findFirst.mockResolvedValue(code);

      const result = await service.findValidVerifiedCode('test@example.com');

      expect(result).toEqual(code);
      expect(mockPrisma.emailVerificationCode.findFirst).toHaveBeenCalledWith({
        where: {
          email: 'test@example.com',
          verifiedAt: { not: null },
          consumedAt: null,
          expiresAt: { gt: expect.any(Date) },
        },
        orderBy: { verifiedAt: 'desc' },
      });
    });

    it('해당 코드 없으면 null 반환', async () => {
      mockPrisma.emailVerificationCode.findFirst.mockResolvedValue(null);

      const result = await service.findValidVerifiedCode('test@example.com');

      expect(result).toBeNull();
    });
  });
});
