import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';

import { JwtAuthGuard } from './jwt-auth.guard';
import { PrismaService } from 'src/prisma/prisma.service';

type MockPrismaService = {
  user: {
    findUnique: jest.Mock;
  };
};

type MockJwtService = {
  verify: jest.Mock;
};

type MockReflector = {
  getAllAndOverride: jest.Mock;
};

const createContext = (headers: Record<string, string>): ExecutionContext => {
  const req: { headers: Record<string, string>; user?: unknown } = { headers };
  return {
    switchToHttp: () => ({
      getRequest: () => req,
    }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext;
};

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let mockPrisma: MockPrismaService;
  let mockJwtService: MockJwtService;
  let mockReflector: MockReflector;

  beforeEach(() => {
    mockPrisma = { user: { findUnique: jest.fn() } };
    mockJwtService = { verify: jest.fn() };
    mockReflector = { getAllAndOverride: jest.fn().mockReturnValue(false) };
    guard = new JwtAuthGuard(
      mockJwtService as unknown as JwtService,
      mockPrisma as unknown as PrismaService,
      mockReflector as unknown as Reflector,
    );
  });

  it('Authorization 헤더 없으면 UnauthorizedException', async () => {
    const context = createContext({});

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('Bearer 형식이 아니면 UnauthorizedException', async () => {
    const context = createContext({ authorization: 'Basic abc123' });

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('토큰 검증 실패하면 UnauthorizedException', async () => {
    mockJwtService.verify.mockImplementation(() => {
      throw new Error('jwt malformed');
    });
    const context = createContext({ authorization: 'Bearer bad.token' });

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('토큰의 유저가 존재하지 않으면 UnauthorizedException', async () => {
    mockJwtService.verify.mockReturnValue({ sub: 'missing-user' });
    mockPrisma.user.findUnique.mockResolvedValue(null);
    const context = createContext({ authorization: 'Bearer valid.token' });

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('정상: req.user에 유저 세팅 후 true 반환', async () => {
    mockJwtService.verify.mockReturnValue({ sub: 'user-1' });
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1', email: 'user@example.com' });
    const context = createContext({ authorization: 'Bearer valid.token' });
    const req = context.switchToHttp().getRequest<{ user?: unknown }>();

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'user-1' } });
    expect(req.user).toEqual({ id: 'user-1', email: 'user@example.com' });
  });

  describe('@OptionalAuth()가 붙은 라우트', () => {
    beforeEach(() => {
      mockReflector.getAllAndOverride.mockReturnValue(true);
    });

    it('Authorization 헤더 없으면 익명으로 통과', async () => {
      const context = createContext({});
      const req = context.switchToHttp().getRequest<{ user?: unknown }>();

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(req.user).toBeUndefined();
    });

    it('Bearer 형식이 아니어도 익명으로 통과', async () => {
      const context = createContext({ authorization: 'Basic abc123' });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('토큰 검증 실패해도 익명으로 통과', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('jwt malformed');
      });
      const context = createContext({ authorization: 'Bearer bad.token' });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('토큰의 유저가 존재하지 않아도 익명으로 통과', async () => {
      mockJwtService.verify.mockReturnValue({ sub: 'missing-user' });
      mockPrisma.user.findUnique.mockResolvedValue(null);
      const context = createContext({ authorization: 'Bearer valid.token' });
      const req = context.switchToHttp().getRequest<{ user?: unknown }>();

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(req.user).toBeUndefined();
    });

    it('유효한 토큰이면 여전히 req.user 세팅', async () => {
      mockJwtService.verify.mockReturnValue({ sub: 'user-1' });
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1', email: 'user@example.com' });
      const context = createContext({ authorization: 'Bearer valid.token' });
      const req = context.switchToHttp().getRequest<{ user?: unknown }>();

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(req.user).toEqual({ id: 'user-1', email: 'user@example.com' });
    });
  });
});
