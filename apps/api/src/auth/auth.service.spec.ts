import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';

import { AuthService } from './auth.service';
import { EmailVerificationService } from './email-verification.service';
import { PrismaService } from 'src/prisma/prisma.service';

type MockPrismaService = {
  user: {
    findUnique: jest.Mock;
    create: jest.Mock;
  };
  $transaction: jest.Mock;
};

const createMockPrisma = (): MockPrismaService => ({
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  $transaction: jest.fn(),
});

type MockEmailVerificationService = {
  normalizeEmail: jest.Mock;
  findValidVerifiedCode: jest.Mock;
};

const createMockEmailVerificationService = (): MockEmailVerificationService => ({
  normalizeEmail: jest.fn((email: string) => email.trim().toLowerCase()),
  findValidVerifiedCode: jest.fn(),
});

type MockJwtService = {
  sign: jest.Mock;
  verify: jest.Mock;
};

const createMockJwtService = (): MockJwtService => ({
  sign: jest.fn().mockReturnValue('mock.jwt.token'),
  verify: jest.fn(),
});

describe('AuthService', () => {
  let service: AuthService;
  let mockPrisma: MockPrismaService;
  let mockEmailVerificationService: MockEmailVerificationService;
  let mockJwtService: MockJwtService;

  beforeEach(async () => {
    mockPrisma = createMockPrisma();
    mockEmailVerificationService = createMockEmailVerificationService();
    mockJwtService = createMockJwtService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EmailVerificationService, useValue: mockEmailVerificationService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─────────────────────────────────────────────
  // issueToken
  // ─────────────────────────────────────────────
  describe('issueToken', () => {
    it('userId로 JWT 토큰 발급', () => {
      mockJwtService.sign.mockReturnValue('signed.token');

      const result = service.issueToken('user-id-123');

      expect(result).toBe('signed.token');
      expect(mockJwtService.sign).toHaveBeenCalledWith({ sub: 'user-id-123' });
    });
  });

  // ─────────────────────────────────────────────
  // issueSocialPendingToken
  // ─────────────────────────────────────────────
  describe('issueSocialPendingToken', () => {
    it('소셜 프로필로 24h 만료 pending 토큰 발급', () => {
      mockJwtService.sign.mockReturnValue('pending.token');

      const result = service.issueSocialPendingToken({ kakaoId: 'kakao-123' });

      expect(result).toBe('pending.token');
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        { kakaoId: 'kakao-123' },
        { expiresIn: '24h' },
      );
    });
  });

  // ─────────────────────────────────────────────
  // socialRegister
  // ─────────────────────────────────────────────
  describe('socialRegister', () => {
    const registerData = {
      nickname: 'tester',
      bio: 'hello',
      profileImageUrl: 'https://img.example.com/1.jpg',
      preferredGenres: [],
    };

    it('유효하지 않은 토큰이면 UnauthorizedException', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('jwt malformed');
      });

      await expect(service.socialRegister('bad.token', registerData)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('토큰에 소셜 ID가 없으면 UnauthorizedException', async () => {
      mockJwtService.verify.mockReturnValue({});

      await expect(service.socialRegister('valid.token', registerData)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('이미 가입된 네이버 계정이면 ConflictException (NAVER_ACCOUNT_ALREADY_EXISTS)', async () => {
      mockJwtService.verify.mockReturnValue({ naverId: 'naver-123' });
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing-user' });

      const err = await service.socialRegister('valid.token', registerData).catch((e) => e);
      expect(err).toBeInstanceOf(ConflictException);
      expect(err.response).toMatchObject({ errorCode: 'NAVER_ACCOUNT_ALREADY_EXISTS' });
    });

    it('이미 가입된 카카오 계정이면 ConflictException (KAKAO_ACCOUNT_ALREADY_EXISTS)', async () => {
      mockJwtService.verify.mockReturnValue({ kakaoId: 'kakao-123' });
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing-user' });

      const err = await service.socialRegister('valid.token', registerData).catch((e) => e);
      expect(err).toBeInstanceOf(ConflictException);
      expect(err.response).toMatchObject({ errorCode: 'KAKAO_ACCOUNT_ALREADY_EXISTS' });
    });

    it('이미 가입된 구글 계정이면 ConflictException (GOOGLE_ACCOUNT_ALREADY_EXISTS)', async () => {
      mockJwtService.verify.mockReturnValue({ googleId: 'google-123' });
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing-user' });

      const err = await service.socialRegister('valid.token', registerData).catch((e) => e);
      expect(err).toBeInstanceOf(ConflictException);
      expect(err.response).toMatchObject({ errorCode: 'GOOGLE_ACCOUNT_ALREADY_EXISTS' });
    });

    it('닉네임 중복이면 ConflictException (NICKNAME_ALREADY_EXISTS)', async () => {
      mockJwtService.verify.mockReturnValue({ kakaoId: 'kakao-123' });
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(null) // kakaoId 없음
        .mockResolvedValueOnce({ id: 'nick-conflict' }); // nickname 중복

      const err = await service.socialRegister('valid.token', registerData).catch((e) => e);
      expect(err).toBeInstanceOf(ConflictException);
      expect(err.response).toMatchObject({ errorCode: 'NICKNAME_ALREADY_EXISTS' });
    });

    it('정상 케이스: 유저 생성 후 JWT 반환', async () => {
      mockJwtService.verify.mockReturnValue({ kakaoId: 'kakao-123' });
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(null) // kakaoId 없음
        .mockResolvedValueOnce(null); // nickname 없음
      mockPrisma.user.create.mockResolvedValue({ id: 'new-user-id' });
      mockJwtService.sign.mockReturnValue('new.jwt.token');

      const result = await service.socialRegister('valid.token', registerData);

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          naverId: undefined,
          kakaoId: 'kakao-123',
          googleId: undefined,
          nickname: 'tester',
          bio: 'hello',
          profileImage: 'https://img.example.com/1.jpg',
          preferredGenres: [],
        },
      });
      expect(result).toBe('new.jwt.token');
    });
  });

  // ─────────────────────────────────────────────
  // register
  // ─────────────────────────────────────────────
  describe('register', () => {
    const registerData = {
      email: '  NEW@Example.COM  ',
      password: 'password123',
      nickname: 'tester',
      bio: 'hello',
      profileImageUrl: 'https://img.example.com/1.jpg',
      preferredGenres: [],
    };

    it('이미 가입된 이메일이면 ConflictException (EMAIL_ALREADY_EXISTS)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing' });

      const err = await service.register(registerData).catch((e) => e);
      expect(err).toBeInstanceOf(ConflictException);
      expect(err.response).toMatchObject({ errorCode: 'EMAIL_ALREADY_EXISTS' });
    });

    it('이메일 인증이 안 됐으면 BadRequestException (EMAIL_NOT_VERIFIED)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockEmailVerificationService.findValidVerifiedCode.mockResolvedValue(null);

      const err = await service.register(registerData).catch((e) => e);
      expect(err).toBeInstanceOf(BadRequestException);
      expect(err.response).toMatchObject({ errorCode: 'EMAIL_NOT_VERIFIED' });
    });

    it('닉네임 중복이면 ConflictException (NICKNAME_ALREADY_EXISTS)', async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(null) // 이메일 없음
        .mockResolvedValueOnce({ id: 'nick-conflict' }); // 닉네임 중복
      mockEmailVerificationService.findValidVerifiedCode.mockResolvedValue({ id: 99 });

      const err = await service.register(registerData).catch((e) => e);
      expect(err).toBeInstanceOf(ConflictException);
      expect(err.response).toMatchObject({ errorCode: 'NICKNAME_ALREADY_EXISTS' });
    });

    it('정상 케이스: 트랜잭션으로 유저 생성 + 인증코드 소비 처리 후 JWT 반환', async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(null) // 이메일 없음
        .mockResolvedValueOnce(null); // 닉네임 없음
      mockEmailVerificationService.findValidVerifiedCode.mockResolvedValue({ id: 99 });

      const mockTx = {
        user: { create: jest.fn().mockResolvedValue({ id: 'created-user-id' }) },
        emailVerificationCode: { update: jest.fn().mockResolvedValue({}) },
      };
      mockPrisma.$transaction.mockImplementation((cb: (tx: typeof mockTx) => Promise<unknown>) =>
        cb(mockTx),
      );
      mockJwtService.sign.mockReturnValue('final.jwt.token');

      const result = await service.register(registerData);

      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
      expect(mockTx.user.create).toHaveBeenCalledWith({
        data: {
          email: 'new@example.com', // normalizeEmail 적용된 값
          password: expect.any(String),
          nickname: 'tester',
          bio: 'hello',
          profileImage: 'https://img.example.com/1.jpg',
          preferredGenres: [],
        },
      });
      expect(mockTx.emailVerificationCode.update).toHaveBeenCalledWith({
        where: { id: 99 },
        data: { consumedAt: expect.any(Date) },
      });
      expect(result).toBe('final.jwt.token');
    });

    it('비밀번호는 bcrypt로 해시되어 저장', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
      mockEmailVerificationService.findValidVerifiedCode.mockResolvedValue({ id: 99 });

      const mockTx = {
        user: { create: jest.fn().mockResolvedValue({ id: 'created-user-id' }) },
        emailVerificationCode: { update: jest.fn().mockResolvedValue({}) },
      };
      mockPrisma.$transaction.mockImplementation((cb: (tx: typeof mockTx) => Promise<unknown>) =>
        cb(mockTx),
      );

      await service.register(registerData);

      const createCall = mockTx.user.create.mock.calls[0][0];
      const hashedPassword: string = createCall.data.password;
      const isMatch = await bcrypt.compare('password123', hashedPassword);
      expect(isMatch).toBe(true);
    });
  });
});
