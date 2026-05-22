import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { prisma } from '@repo/db';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async findOrCreateNaverUser({
    naverId,
    email,
    nickname,
    profileImage,
  }: {
    naverId: string;
    email?: string;
    nickname: string;
    profileImage?: string;
  }) {
    return prisma.user.upsert({
      where: { naverId },
      update: {},
      create: { naverId, email, nickname, profileImage },
    });
  }

  issueToken(userId: string): string {
    return this.jwtService.sign({ sub: userId });
  }
}
