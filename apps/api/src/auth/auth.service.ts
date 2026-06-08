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

  async findUserByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  async findUserByNaverId(naverId: string) {
    return prisma.user.findUnique({ where: { naverId } });
  }

  async findUserByNickname(nickname: string) {
    return prisma.user.findUnique({ where: { nickname } });
  }

  // 소셜 로그인 신규 유저용 pending token 발급
  issueSocialPendingToken(profile: { naverId: string }): string {
    return this.jwtService.sign({ ...profile }, { expiresIn: '24h' });
  }

  // 소셜 로그인 회원가입 (pending token 검증 후 유저 생성)
  async socialRegister(
    socialPendingToken: string,
    data: { nickname: string; bio: string; profileImageUrl?: string; preferredGenres: Genre[] },
  ) {
    let payload: { naverId: string };
    try {
      payload = this.jwtService.verify<{ naverId: string }>(socialPendingToken);
    } catch {
      throw new UnauthorizedException();
    }
    if (!payload.naverId) throw new UnauthorizedException();

    // 이미 가입된 경우
    const existingNaverUser = await this.findUserByNaverId(payload.naverId);
    if (existingNaverUser) throw new ConflictException('이미 가입된 네이버 계정입니다.');

    // TODO: kakao, google

    const existingNicknameUser = await this.findUserByNickname(data.nickname);
    if (existingNicknameUser) throw new ConflictException('이미 사용 중인 닉네임입니다.');

    const user = await prisma.user.create({
      data: {
        naverId: payload.naverId,
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
    const existingEmailUser = await this.findUserByEmail(data.email);
    if (existingEmailUser) {
      throw new ConflictException('이미 가입된 이메일입니다.');
    }

    const existingNicknameUser = await this.findUserByNickname(data.nickname);
    if (existingNicknameUser) throw new ConflictException('이미 사용 중인 닉네임입니다.');

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
