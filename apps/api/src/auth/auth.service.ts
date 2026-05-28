import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { prisma } from '@repo/db';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  issueToken(userId: string): string {
    return this.jwtService.sign({ sub: userId });
  }

  async findNaverUser(naverId: string) {
    return prisma.user.findUnique({ where: { naverId } });
  }

  // 소셜 로그인 신규 유저용 pending token 발급
  issueSocialPendingToken(profile: {
    naverId: string;
    email?: string;
    nickname?: string;
    profileImage?: string;
  }): string {
    return this.jwtService.sign({ ...profile, status: 'pending' }, { expiresIn: '30m' });
  }

  // 소셜 로그인 회원가입 완료 (pending token 검증 후 유저 생성)
  async socialRegister(
    socialPendingToken: string,
    data: { nickname: string; bio: string; profileImageUrl?: string; genres: string[] },
  ) {
    const payload = this.jwtService.verify<{ naverId: string; email?: string; status: string }>(
      socialPendingToken,
    );
    if (payload.status !== 'pending') throw new UnauthorizedException();

    // 이미 가입된 경우
    const existingUser = await prisma.user.findUnique({ where: { naverId: payload.naverId } });
    if (existingUser) throw new ConflictException('이미 가입된 유저입니다.');

    const user = await prisma.user.create({
      data: { naverId: payload.naverId, email: payload.email, ...data },
    });
    return this.issueToken(user.id);
  }
}
