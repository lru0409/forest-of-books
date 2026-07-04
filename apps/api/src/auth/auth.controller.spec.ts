import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { Request, Response } from 'express';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmailVerificationService } from './email-verification.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

type MockAuthService = {
  issueToken: jest.Mock;
  issueSocialPendingToken: jest.Mock;
  findUserByNaverId: jest.Mock;
  findUserByKakaoId: jest.Mock;
  findUserByGoogleId: jest.Mock;
  findUserByNickname: jest.Mock;
  socialRegister: jest.Mock;
  register: jest.Mock;
  login: jest.Mock;
};

type MockEmailVerificationService = {
  sendCode: jest.Mock;
  verifyCode: jest.Mock;
};

const createMockAuthService = (): MockAuthService => ({
  issueToken: jest.fn(),
  issueSocialPendingToken: jest.fn(),
  findUserByNaverId: jest.fn(),
  findUserByKakaoId: jest.fn(),
  findUserByGoogleId: jest.fn(),
  findUserByNickname: jest.fn(),
  socialRegister: jest.fn(),
  register: jest.fn(),
  login: jest.fn(),
});

const createMockEmailVerificationService = (): MockEmailVerificationService => ({
  sendCode: jest.fn(),
  verifyCode: jest.fn(),
});

const makeRes = () =>
  ({
    redirect: jest.fn(),
    cookie: jest.fn(),
    clearCookie: jest.fn(),
    json: jest.fn(),
  }) as unknown as Response;

describe('AuthController', () => {
  let controller: AuthController;
  let mockAuthService: MockAuthService;
  let mockEmailVerificationService: MockEmailVerificationService;

  beforeEach(async () => {
    mockAuthService = createMockAuthService();
    mockEmailVerificationService = createMockEmailVerificationService();

    process.env.API_FRONTEND_URL = 'https://frontend.test';

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: EmailVerificationService, useValue: mockEmailVerificationService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.API_FRONTEND_URL;
  });

  // ─────────────────────────────────────────────
  // naverCallback / kakaoCallback / googleCallback
  // (handleSocialCallback 로직 공유)
  // ─────────────────────────────────────────────
  describe('naverCallback', () => {
    it('기존 유저: token 발급 후 /auth/callback?token= 으로 리다이렉트', async () => {
      mockAuthService.findUserByNaverId.mockResolvedValue({ id: 'user-1' });
      mockAuthService.issueToken.mockReturnValue('jwt.token');
      const req = { user: { naverId: 'naver-123' } } as unknown as Request;
      const res = makeRes();

      await controller.naverCallback(req, res);

      expect(mockAuthService.issueToken).toHaveBeenCalledWith('user-1');
      expect(res.redirect).toHaveBeenCalledWith(
        'https://frontend.test/auth/callback?token=jwt.token',
      );
    });

    it('신규 유저: pending token 쿠키 설정 후 /signup?step=2&social_login=true 리다이렉트', async () => {
      mockAuthService.findUserByNaverId.mockResolvedValue(null);
      mockAuthService.issueSocialPendingToken.mockReturnValue('pending.token');
      const req = { user: { naverId: 'naver-new' } } as unknown as Request;
      const res = makeRes();

      await controller.naverCallback(req, res);

      expect(mockAuthService.issueSocialPendingToken).toHaveBeenCalledWith({ naverId: 'naver-new' });
      expect(res.cookie).toHaveBeenCalledWith('social_pending_token', 'pending.token', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000,
      });
      expect(res.redirect).toHaveBeenCalledWith(
        'https://frontend.test/signup?step=2&social_login=true',
      );
    });
  });

  describe('kakaoCallback', () => {
    it('기존 유저: token 발급 후 /auth/callback?token= 으로 리다이렉트', async () => {
      mockAuthService.findUserByKakaoId.mockResolvedValue({ id: 'user-2' });
      mockAuthService.issueToken.mockReturnValue('jwt.token');
      const req = { user: { kakaoId: 'kakao-123' } } as unknown as Request;
      const res = makeRes();

      await controller.kakaoCallback(req, res);

      expect(mockAuthService.issueToken).toHaveBeenCalledWith('user-2');
      expect(res.redirect).toHaveBeenCalledWith(
        'https://frontend.test/auth/callback?token=jwt.token',
      );
    });

    it('신규 유저: pending token 쿠키 설정 후 /signup 리다이렉트', async () => {
      mockAuthService.findUserByKakaoId.mockResolvedValue(null);
      mockAuthService.issueSocialPendingToken.mockReturnValue('pending.token');
      const req = { user: { kakaoId: 'kakao-new' } } as unknown as Request;
      const res = makeRes();

      await controller.kakaoCallback(req, res);

      expect(mockAuthService.issueSocialPendingToken).toHaveBeenCalledWith({ kakaoId: 'kakao-new' });
      expect(res.cookie).toHaveBeenCalledWith('social_pending_token', 'pending.token', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000,
      });
      expect(res.redirect).toHaveBeenCalledWith(
        'https://frontend.test/signup?step=2&social_login=true',
      );
    });
  });

  describe('googleCallback', () => {
    it('기존 유저: token 발급 후 /auth/callback?token= 으로 리다이렉트', async () => {
      mockAuthService.findUserByGoogleId.mockResolvedValue({ id: 'user-3' });
      mockAuthService.issueToken.mockReturnValue('jwt.token');
      const req = { user: { googleId: 'google-123' } } as unknown as Request;
      const res = makeRes();

      await controller.googleCallback(req, res);

      expect(mockAuthService.issueToken).toHaveBeenCalledWith('user-3');
      expect(res.redirect).toHaveBeenCalledWith(
        'https://frontend.test/auth/callback?token=jwt.token',
      );
    });

    it('신규 유저: pending token 쿠키 설정 후 /signup 리다이렉트', async () => {
      mockAuthService.findUserByGoogleId.mockResolvedValue(null);
      mockAuthService.issueSocialPendingToken.mockReturnValue('pending.token');
      const req = { user: { googleId: 'google-new' } } as unknown as Request;
      const res = makeRes();

      await controller.googleCallback(req, res);

      expect(mockAuthService.issueSocialPendingToken).toHaveBeenCalledWith({ googleId: 'google-new' });
      expect(res.cookie).toHaveBeenCalledWith('social_pending_token', 'pending.token', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000,
      });
      expect(res.redirect).toHaveBeenCalledWith(
        'https://frontend.test/signup?step=2&social_login=true',
      );
    });
  });

  // ─────────────────────────────────────────────
  // sendEmailVerificationCode
  // ─────────────────────────────────────────────
  describe('sendEmailVerificationCode', () => {
    it('sendCode 호출 후 null 반환', async () => {
      mockEmailVerificationService.sendCode.mockResolvedValue(undefined);

      const result = await controller.sendEmailVerificationCode({ email: 'test@example.com' });

      expect(mockEmailVerificationService.sendCode).toHaveBeenCalledWith('test@example.com');
      expect(result).toBeNull();
    });
  });

  // ─────────────────────────────────────────────
  // verifyEmailCode
  // ─────────────────────────────────────────────
  describe('verifyEmailCode', () => {
    it('verifyCode 호출 후 null 반환', async () => {
      mockEmailVerificationService.verifyCode.mockResolvedValue(undefined);

      const result = await controller.verifyEmailCode({
        email: 'test@example.com',
        code: '123456',
      });

      expect(mockEmailVerificationService.verifyCode).toHaveBeenCalledWith(
        'test@example.com',
        '123456',
      );
      expect(result).toBeNull();
    });
  });

  // ─────────────────────────────────────────────
  // checkNickname
  // ─────────────────────────────────────────────
  describe('checkNickname', () => {
    it('사용 가능한 닉네임 → { available: true }', async () => {
      mockAuthService.findUserByNickname.mockResolvedValue(null);

      const result = await controller.checkNickname({ nickname: 'newuser' });

      expect(result).toEqual({ available: true });
    });

    it('이미 사용 중인 닉네임 → { available: false }', async () => {
      mockAuthService.findUserByNickname.mockResolvedValue({ id: 'existing' });

      const result = await controller.checkNickname({ nickname: 'takenuser' });

      expect(result).toEqual({ available: false });
    });
  });

  // ─────────────────────────────────────────────
  // socialRegister
  // ─────────────────────────────────────────────
  describe('socialRegister', () => {
    const body = {
      nickname: 'tester',
      bio: 'hello',
      profileImageUrl: 'https://img.example.com/1.jpg',
      preferredGenres: [],
    };

    it('쿠키 없으면 UnauthorizedException', async () => {
      const req = { cookies: {} } as unknown as Request;
      const res = makeRes();

      await expect(controller.socialRegister(body, req, res)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('쿠키가 string이 아니면 UnauthorizedException', async () => {
      const req = { cookies: { social_pending_token: 123 } } as unknown as Request;
      const res = makeRes();

      await expect(controller.socialRegister(body, req, res)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('정상: cookie 소비 + socialRegister 호출 + token 응답', async () => {
      mockAuthService.socialRegister.mockResolvedValue('final.jwt');
      const req = { cookies: { social_pending_token: 'pending.token' } } as unknown as Request;
      const res = makeRes();

      await controller.socialRegister(body, req, res);

      expect(res.clearCookie).toHaveBeenCalledWith('social_pending_token');
      expect(mockAuthService.socialRegister).toHaveBeenCalledWith('pending.token', body);
      expect(res.json).toHaveBeenCalledWith({ token: 'final.jwt' });
    });

    it('service throw 시 에러 전파 + clearCookie는 이미 호출된 상태', async () => {
      mockAuthService.socialRegister.mockRejectedValue(new Error('registration failed'));
      const req = { cookies: { social_pending_token: 'pending.token' } } as unknown as Request;
      const res = makeRes();

      await expect(controller.socialRegister(body, req, res)).rejects.toThrow('registration failed');
      expect(res.clearCookie).toHaveBeenCalledWith('social_pending_token');
    });
  });

  // ─────────────────────────────────────────────
  // register
  // ─────────────────────────────────────────────
  describe('register', () => {
    it('register 호출 후 token 응답', async () => {
      const body = {
        email: 'new@example.com',
        password: 'Password1!',
        nickname: 'tester',
        bio: 'hello',
        profileImageUrl: 'https://img.example.com/1.jpg',
        preferredGenres: [],
      };
      mockAuthService.register.mockResolvedValue('user.jwt');
      const res = makeRes();

      await controller.register(body, res);

      expect(mockAuthService.register).toHaveBeenCalledWith(body);
      expect(res.json).toHaveBeenCalledWith({ token: 'user.jwt' });
    });
  });

  // ─────────────────────────────────────────────
  // login
  // ─────────────────────────────────────────────
  describe('login', () => {
    it('login 호출 후 token 응답', async () => {
      const body = { email: 'user@example.com', password: 'Password1!' };
      mockAuthService.login.mockResolvedValue('user.jwt');
      const res = makeRes();

      await controller.login(body, res);

      expect(mockAuthService.login).toHaveBeenCalledWith(body);
      expect(res.json).toHaveBeenCalledWith({ token: 'user.jwt' });
    });
  });

  // ─────────────────────────────────────────────
  // me
  // ─────────────────────────────────────────────
  describe('me', () => {
    it('req.user에서 password를 제외하고 반환', () => {
      const req = {
        user: { id: 'user-1', email: 'user@example.com', nickname: 'tester', password: 'hashed' },
      } as unknown as Request;

      const result = controller.me(req);

      expect(result).toEqual({ id: 'user-1', email: 'user@example.com', nickname: 'tester' });
    });
  });
});
