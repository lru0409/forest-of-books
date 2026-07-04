import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
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

const createContext = (headers: Record<string, string>): ExecutionContext => {
  const req: { headers: Record<string, string>; user?: unknown } = { headers };
  return {
    switchToHttp: () => ({
      getRequest: () => req,
    }),
  } as unknown as ExecutionContext;
};

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let mockPrisma: MockPrismaService;
  let mockJwtService: MockJwtService;

  beforeEach(() => {
    mockPrisma = { user: { findUnique: jest.fn() } };
    mockJwtService = { verify: jest.fn() };
    guard = new JwtAuthGuard(
      mockJwtService as unknown as JwtService,
      mockPrisma as unknown as PrismaService,
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
});
