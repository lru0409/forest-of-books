import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { Genre, prisma } from '@repo/db';

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
    return this.jwtService.sign({ ...profile, status: 'pending' }, { expiresIn: '24h' });
  }

  // 소셜 로그인 회원가입 (pending token 검증 후 유저 생성)
  async socialRegister(
    socialPendingToken: string,
    data: { nickname: string; bio: string; profileImageUrl?: string; preferredGenres: Genre[] },
  ) {
    const payload = this.jwtService.verify<{ naverId: string; email?: string; status: string }>(
      socialPendingToken,
    );
    if (payload.status !== 'pending') throw new UnauthorizedException();

    // 이미 가입된 경우
    const existingUser = await prisma.user.findUnique({ where: { naverId: payload.naverId } });
    if (existingUser) throw new ConflictException('이미 가입된 유저입니다.');

    const user = await prisma.user.create({
      data: {
        naverId: payload.naverId,
        email: payload.email,
        nickname: data.nickname,
        bio: data.bio,
        preferredGenres: data.preferredGenres,
      },
    });
    return this.issueToken(user.id);
  }

  // 일반 회원가입
  async register(data: {
    email: string;
    password: string;
    nickname: string;
    bio: string;
    preferredGenres: Genre[];
  }) {
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) throw new ConflictException('이미 가입된 유저입니다.');

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        nickname: data.nickname,
        bio: data.bio,
        preferredGenres: data.preferredGenres,
      },
    });
    return this.issueToken(user.id);
  }
}
