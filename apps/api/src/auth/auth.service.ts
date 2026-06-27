import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { Genre } from '@repo/db';
import { EmailVerificationService } from './email-verification.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private emailVerificationService: EmailVerificationService,
    private prisma: PrismaService,
  ) {}

  issueToken(userId: string): string {
    return this.jwtService.sign({ sub: userId });
  }

  private async findUserByEmail(email: string) {
    const normalizedEmail = this.emailVerificationService.normalizeEmail(email);
    return this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
  }

  async findUserByNaverId(naverId: string) {
    return this.prisma.user.findUnique({ where: { naverId } });
  }

  async findUserByKakaoId(kakaoId: string) {
    return this.prisma.user.findUnique({ where: { kakaoId } });
  }

  async findUserByGoogleId(googleId: string) {
    return this.prisma.user.findUnique({ where: { googleId } });
  }

  async findUserByNickname(nickname: string) {
    return this.prisma.user.findUnique({ where: { nickname } });
  }

  // 소셜 로그인 신규 유저용 pending token 발급
  issueSocialPendingToken(profile: {
    naverId?: string;
    kakaoId?: string;
    googleId?: string;
  }): string {
    return this.jwtService.sign({ ...profile }, { expiresIn: '24h' });
  }

  // 소셜 로그인 회원가입 (pending token 검증 후 유저 생성)
  async socialRegister(
    socialPendingToken: string,
    data: { nickname: string; bio: string; profileImageUrl: string; preferredGenres: Genre[] },
  ) {
    let payload: { naverId?: string; kakaoId?: string; googleId?: string };
    try {
      payload = this.jwtService.verify<{ naverId?: string; kakaoId?: string; googleId?: string }>(
        socialPendingToken,
      );
    } catch {
      throw new UnauthorizedException();
    }
    if (!payload.naverId && !payload.kakaoId && !payload.googleId)
      throw new UnauthorizedException();

    // 이미 가입된 경우
    if (payload.naverId) {
      const existingNaverUser = await this.findUserByNaverId(payload.naverId);
      if (existingNaverUser)
        throw new ConflictException({
          errorCode: 'NAVER_ACCOUNT_ALREADY_EXISTS',
          message: '이미 가입된 네이버 계정입니다.',
        });
    }
    if (payload.kakaoId) {
      const existingKakaoUser = await this.findUserByKakaoId(payload.kakaoId);
      if (existingKakaoUser)
        throw new ConflictException({
          errorCode: 'KAKAO_ACCOUNT_ALREADY_EXISTS',
          message: '이미 가입된 카카오 계정입니다.',
        });
    }
    if (payload.googleId) {
      const existingGoogleUser = await this.findUserByGoogleId(payload.googleId);
      if (existingGoogleUser)
        throw new ConflictException({
          errorCode: 'GOOGLE_ACCOUNT_ALREADY_EXISTS',
          message: '이미 가입된 구글 계정입니다.',
        });
    }

    const existingNicknameUser = await this.findUserByNickname(data.nickname);
    if (existingNicknameUser)
      throw new ConflictException({
        errorCode: 'NICKNAME_ALREADY_EXISTS',
        message: '이미 사용 중인 닉네임입니다.',
      });

    const user = await this.prisma.user.create({
      data: {
        naverId: payload.naverId,
        kakaoId: payload.kakaoId,
        googleId: payload.googleId,
        nickname: data.nickname,
        bio: data.bio,
        profileImage: data.profileImageUrl,
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
    profileImageUrl: string;
    preferredGenres: Genre[];
  }) {
    const normalizedEmail = this.emailVerificationService.normalizeEmail(data.email);
    const existingEmailUser = await this.findUserByEmail(normalizedEmail);
    if (existingEmailUser) {
      throw new ConflictException({
        errorCode: 'EMAIL_ALREADY_EXISTS',
        message: '이미 가입된 이메일입니다.',
      });
    }

    const emailVerificationCode =
      await this.emailVerificationService.findValidVerifiedCode(normalizedEmail);
    if (!emailVerificationCode) {
      throw new BadRequestException({
        errorCode: 'EMAIL_NOT_VERIFIED',
        message: '이메일 인증이 필요합니다.',
      });
    }

    const existingNicknameUser = await this.findUserByNickname(data.nickname);
    if (existingNicknameUser)
      throw new ConflictException({
        errorCode: 'NICKNAME_ALREADY_EXISTS',
        message: '이미 사용 중인 닉네임입니다.',
      });

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email: normalizedEmail,
          password: hashedPassword,
          nickname: data.nickname,
          bio: data.bio,
          profileImage: data.profileImageUrl,
          preferredGenres: data.preferredGenres,
        },
      });
      await tx.emailVerificationCode.delete({
        where: { id: emailVerificationCode.id },
      });
      return createdUser;
    });

    return this.issueToken(user.id);
  }
}
